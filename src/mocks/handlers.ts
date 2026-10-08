import { delay, http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { catalogSelections } from './fixtures'
import { save, store, user } from './store'
import { nftListeners, orderListeners } from './events'
import type { NftUpdated } from '../contracts'
import { fromWei, toWei } from '../lib/money'

const realtime = ws.link(
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/`,
)

export const handlers = [
  http.get('/api/nfts/recommendations', async () => {
    await delay(150)
    const featured = ['4', '5', '6', '7', '9']
    const nfts = store().nfts
    return HttpResponse.json(
      [
        ...featured.flatMap((id) => nfts.filter((nft) => nft.id === id)),
        ...nfts.filter((nft) => !featured.includes(nft.id)),
      ].slice(0, 15),
    )
  }),
  http.get('/api/nfts', async ({ request }) => {
    const params = new URL(request.url).searchParams
    await delay(
      store().scenario === 'variable'
        ? params.get('sort') === 'price-asc'
          ? 1200
          : 100
        : params.get('q') === 'slow'
          ? 1500
          : 150,
    )
    if (store().scenario === 'offline') return HttpResponse.error()
    if (store().scenario === 'server-error')
      return HttpResponse.json(
        { message: 'Serviço temporariamente indisponível.' },
        { status: 503 },
      )
    if (store().scenario === 'slow') await delay(2000)
    const view = params.get('view')
    const selection = view === 'new' || view === 'trending' ? catalogSelections[view] : null
    const query = (params.get('q') ?? '').toLowerCase()
    const category = params.get('category')
    const network = params.get('network')
    const page = Math.max(1, Number(params.get('page')) || 1)
    const min = params.get('min') || '0'
    const max = params.get('max') || '1000000'
    if (![min, max].every((value) => /^\d+(\.\d{1,18})?$/.test(value))) {
      return HttpResponse.json(
        { code: 'VALIDATION', message: 'Faixa de preço inválida.' },
        { status: 422 },
      )
    }
    const items = store().nfts.filter(
      (nft) =>
        (!selection || selection.includes(nft.id)) &&
        nft.name.toLowerCase().includes(query) &&
        (params.get('featured') !== 'true' || nft.featured) &&
        (!category || nft.category === category) &&
        (!network || nft.network === network) &&
        toWei(nft.price) >= toWei(min) &&
        toWei(nft.price) <= toWei(max),
    )
    if (params.get('sort') === 'price-asc')
      items.sort((a, b) =>
        toWei(a.price) < toWei(b.price) ? -1 : toWei(a.price) > toWei(b.price) ? 1 : 0,
      )
    if (params.get('sort') === 'price-desc')
      items.sort((a, b) =>
        toWei(a.price) > toWei(b.price) ? -1 : toWei(a.price) < toWei(b.price) ? 1 : 0,
      )
    return HttpResponse.json({
      items: items.slice((page - 1) * 9, page * 9),
      total: items.length,
      pages: Math.ceil(items.length / 9),
      filters: {
        categories: [
          'Arte digital',
          'Fotografia',
          'Música',
          'Arte 3D',
          'Colecionáveis',
          'Generativa',
          'Jogos',
          'Assinaturas',
          'Utilidade',
        ].map((name) => ({
          name,
          count: store().nfts.filter((nft) => nft.category === name).length,
        })),
        networks: ['Ethereum', 'Polygon', 'Solana'].map((name) => ({
          name,
          count: store().nfts.filter((nft) => nft.network === name).length,
        })),
      },
    })
  }),
  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(150)
    const nft = store().nfts.find((item) => item.id === params.id)
    return nft
      ? HttpResponse.json(nft)
      : HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado.' }, { status: 404 })
  }),
  realtime.addEventListener('connection', (connection) => {
    const socket = toSocketIo(connection)
    const sessionId = user()?.id
    const listener: Parameters<typeof orderListeners.add>[0] = (event) => {
      if (sessionId && user()?.id === sessionId && event.userId === sessionId)
        socket.client.emit('order.updated', event)
    }
    orderListeners.add(listener)
    const nftListener = (event: NftUpdated) => socket.client.emit('nft.updated', event)
    nftListeners.add(nftListener)
    connection.client.addEventListener('close', () => nftListeners.delete(nftListener))
    connection.client.addEventListener('close', () => orderListeners.delete(listener))
    connection.client.addEventListener('message', (event) => {
      if (event.data === '2') connection.client.send('3')
    })
    const heartbeat = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => clearInterval(heartbeat))
    const lastEvents = new Map<string, NftUpdated>()
    const targetNft = (data?: { nftId?: string }) => {
      const nft = store().nfts.find((item) => item.id === (data?.nftId ?? '1'))
      if (!nft) socket.client.emit('demo.result', 'NFT não encontrado para a simulação.')
      return nft
    }
    const emitNft = (data?: { nftId?: string }, soldOut = false) => {
      const nft = targetNft(data)
      if (!nft) return
      if (soldOut) nft.available = 0
      else nft.price = fromWei(toWei(nft.price) + toWei('0.1'))
      nft.version += 1
      save()
      const event: NftUpdated = { eventId: crypto.randomUUID(), nft: { ...nft } }
      lastEvents.set(nft.id, event)
      nftListeners.forEach((listener) => listener(event))
    }
    socket.client.on('demo.update', (_event, data) => emitNft(data))
    socket.client.on('demo.delayed-update', (_event, data) => {
      socket.client.emit('demo.result', 'Mudança de preço agendada para daqui a 2s.')
      const timer = setTimeout(() => emitNft(data), 2000)
      connection.client.addEventListener('close', () => clearTimeout(timer), { once: true })
    })
    socket.client.on('demo.stock', (_event, data) => emitNft(data, true))
    socket.client.on('demo.duplicate', (_event, data) => {
      const nft = targetNft(data)
      if (!nft) return
      const event = lastEvents.get(nft.id) ?? {
        eventId: crypto.randomUUID(),
        nft: structuredClone(nft),
      }
      socket.client.emit('nft.updated', event)
      socket.client.emit('nft.updated', event)
    })
    socket.client.on('demo.old', (_event, data) => {
      const nft = targetNft(data)
      if (!nft) return
      socket.client.emit('nft.updated', {
        eventId: crypto.randomUUID(),
        nft: { ...structuredClone(nft), version: 0, price: '0.01' },
      })
    })
    socket.client.on('demo.old-order', (_event, data?: { orderId?: string }) => {
      const orders = Object.values(store().orders).filter((item) => item.userId === sessionId)
      const order = data?.orderId ? orders.find((item) => item.id === data.orderId) : orders.at(-1)
      if (!order) {
        socket.client.emit(
          'demo.result',
          'Nenhum pedido da sua sessão para testar. Faça uma compra e abra o recibo.',
        )
        return
      }
      const event = {
        eventId: crypto.randomUUID(),
        userId: sessionId,
        order: { ...structuredClone(order), version: 0, status: 'pending' },
      }
      socket.client.emit('order.updated', event)
      socket.client.emit('order.updated', event)
    })
  }),
]
