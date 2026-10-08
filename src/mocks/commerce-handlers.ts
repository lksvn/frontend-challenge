import { delay, http, HttpResponse } from 'msw'
import { cart, cartKey, quote, save, store, user } from './store'
import { body, error, unauthorized, textValid, secondaryAddressValid } from './validation'
import { nftListeners, orderListeners } from './events'
import { fromWei, toWei } from '../lib/money'
import type { Order, OrderUpdated } from '../contracts'

export function settleOrder(order: Order) {
  if (store().orders[order.id] !== order) return
  if (order.status !== 'pending') return
  order.status =
    store().payments?.[order.id] ?? (store().scenario === 'declined' ? 'declined' : 'confirmed')
  order.version += 1
  if (order.status === 'confirmed') {
    for (const bought of order.quote.items) {
      const nft = store().nfts.find((item) => item.id === bought.nft.id)!
      const current = store().carts[order.userId]?.find(
        (item) => item.nft.id === nft.id && item.edition === bought.edition,
      )
      if (current) current.quantity = Math.max(0, current.quantity - bought.quantity)
    }
    store().carts[order.userId] = (store().carts[order.userId] ?? []).filter(
      (item) => item.quantity > 0,
    )
  } else {
    for (const item of order.quote.items) {
      const nft = store().nfts.find((nft) => nft.id === item.nft.id)!
      nft.available += item.quantity
      nft.version += 1
      nftListeners.forEach((listener) =>
        listener({ eventId: crypto.randomUUID(), nft: { ...nft } }),
      )
    }
  }
  save()
  const event: OrderUpdated = {
    eventId: crypto.randomUUID(),
    userId: order.userId,
    order: structuredClone(order),
  }
  orderListeners.forEach((listener) => listener(event))
}

export const commerceHandlers = [
  http.get('/api/cart', () =>
    HttpResponse.json(
      cart().map((item) => ({
        ...item,
        lineSubtotal: fromWei(toWei(item.nft.price) * BigInt(item.quantity)),
      })),
    ),
  ),
  http.put('/api/cart/:id', async ({ request, params }) => {
    const data = await body(request)
    const nft = store().nfts.find((item) => item.id === params.id)
    if (!nft) return error('NFT não encontrado.', 404)
    const quantity = Number(data.quantity)
    const edition = typeof data.edition === 'string' ? data.edition : 'standard'
    if (!nft.editions.find((item) => item.id === edition)?.enabled && quantity !== 0)
      return error('Edição indisponível.', 409, 'AVAILABILITY')
    if (
      typeof data.quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > nft.available
    )
      return error('Quantidade indisponível.', 409, 'AVAILABILITY')
    const items = cart().filter((item) => item.nft.id !== nft.id || item.edition !== edition)
    if (quantity) items.push({ nft, quantity, edition })
    store().carts[cartKey()] = items
    save()
    return HttpResponse.json(items)
  }),
  http.post('/api/quote', async ({ request }) => {
    const data = await body(request)
    try {
      const result = quote(String(data.coupon ?? ''))
      store().quotes[result.id] = result
      save()
      return HttpResponse.json(result)
    } catch (cause) {
      return error((cause as Error).message, 409)
    }
  }),
  http.post('/api/orders', async ({ request }) => {
    const account = user()
    if (!account) return unauthorized()
    const data = await body(request)
    const key = request.headers.get('Idempotency-Key')
    const collector = data.collector as Record<string, string> | undefined
    if (!collector || typeof collector !== 'object' || Array.isArray(collector))
      return error('Confira os dados do colecionador.')
    if (!key) return error('Chave de idempotência obrigatória.')
    const attemptKey = `${account.id}:${key}`
    const payload = JSON.stringify([
      data.quoteId,
      data.walletId,
      Object.entries(collector).sort(([left], [right]) => left.localeCompare(right)),
    ])
    const attempt = store().attempts[attemptKey]
    // Consultar a tentativa antes da validação evita criar outro pedido após um timeout.
    if (attempt)
      return attempt.payload === payload
        ? HttpResponse.json(store().orders[attempt.orderId])
        : error('Chave já utilizada para outra compra.', 409)
    if (
      !collector ||
      typeof collector !== 'object' ||
      Array.isArray(collector) ||
      ['name', 'username', 'email', 'referral', 'ens'].some(
        (field) => typeof collector[field] !== 'string',
      ) ||
      !collector.name?.trim() ||
      !collector.username?.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collector.email ?? '') ||
      !/^[a-zA-Z0-9_]{3,30}$/.test(collector.username) ||
      collector.name.length > 100 ||
      (collector.notes !== undefined &&
        (typeof collector.notes !== 'string' || collector.notes.length > 1000)) ||
      !collector.ens?.endsWith('.eth')
    )
      return error('Confira os dados do colecionador.')
    const fields: Record<string, string> = {}
    if (!textValid(collector.referral, 30))
      fields.referral = 'Informe um código de indicação de até 30 caracteres.'
    if (!textValid(collector.profileName))
      fields.profileName = 'Informe um nome do perfil de até 100 caracteres.'
    if (!secondaryAddressValid(collector.secondaryAddress, collector.network))
      fields.secondaryAddress = 'Informe um ENS .eth ou endereço válido para a rede selecionada.'
    if (Object.keys(fields).length)
      return error(Object.values(fields).join(' '), 422, 'VALIDATION', fields)
    const original = store().quotes[String(data.quoteId)]
    if (original && original.userId !== account.id) return error('Acesso negado à cotação.', 403)
    if (!original || original.expiresAt < Date.now())
      return error('Cotação expirada. Revise novamente.', 409, 'QUOTE_CHANGED')
    const wallet = (store().wallets[account.id] ?? []).find((item) => item.id === data.walletId)
    if (!wallet) return error('Selecione uma carteira cadastrada.')
    if (
      collector.address !== wallet.address ||
      collector.network !== wallet.network ||
      collector.provider !== wallet.provider
    )
      return error('Confira os dados da carteira selecionada.', 422, 'VALIDATION', {
        address: 'O endereço deve corresponder à carteira cadastrada.',
        network: 'A rede deve corresponder à carteira cadastrada.',
        provider: 'O tipo deve corresponder à carteira cadastrada.',
      })
    let latest
    try {
      latest = quote(original.coupon)
    } catch (cause) {
      return error((cause as Error).message, 409, 'QUOTE_CHANGED')
    }
    if (
      !latest.items.length ||
      latest.total !== original.total ||
      JSON.stringify(latest.items) !== JSON.stringify(original.items)
    )
      return error('Carrinho ou preço alterado. Revise novamente.', 409, 'QUOTE_CHANGED')
    const order: Order = {
      id: crypto.randomUUID(),
      userId: account.id,
      status: 'pending',
      quote: {
        // O recibo conserva estes valores mesmo que o catálogo mude depois.
        ...structuredClone(original),
        items: original.items.map((item) => ({
          ...structuredClone(item),
          lineSubtotal: fromWei(toWei(item.nft.price) * BigInt(item.quantity)),
        })),
      },
      transaction: `sim-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      wallet: { provider: wallet.provider, network: wallet.network, address: wallet.address },
      version: 1,
      collector: { ...collector },
    }
    store().orders[order.id] = order
    store().attempts[attemptKey] = { payload, orderId: order.id }
    store().payments ??= {}
    store().payments![order.id] = store().scenario === 'declined' ? 'declined' : 'confirmed'
    for (const item of order.quote.items) {
      const nft = store().nfts.find((nft) => nft.id === item.nft.id)!
      nft.available -= item.quantity
      nft.version += 1
      nftListeners.forEach((listener) =>
        listener({ eventId: crypto.randomUUID(), nft: { ...nft } }),
      )
    }
    save()
    setTimeout(() => settleOrder(order), 1500)
    if (store().scenario === 'timeout') await delay(10_000)
    return HttpResponse.json(order, { status: 201 })
  }),
  http.get('/api/orders/:id', ({ params }) => {
    if (!user()) return unauthorized()
    const order = store().orders[String(params.id)]
    if (!order) return error('Pedido não encontrado.', 404)
    if (order.userId !== user()!.id) return error('Acesso negado.', 403)
    if (order.status === 'pending') setTimeout(() => settleOrder(order), 1500)
    return HttpResponse.json(order)
  }),
]
