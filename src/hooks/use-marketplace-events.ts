import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import type { Catalog, CartItem, Nft, NftUpdated, Order, OrderUpdated, User } from '../contracts'
import { useSession } from './use-session'

export function useMarketplaceEvents() {
  const client = useQueryClient()
  const session = useSession()
  const [socket] = useState(() =>
    io(window.location.origin, {
      transports: ['websocket'],
      autoConnect: false,
    }),
  )
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const versions = new Map<string, number>()
    const update = ({ nft }: NftUpdated) => {
      const detail = client.getQueryData<Nft>(['nft', nft.id])
      const catalogVersions = client
        .getQueriesData<Catalog>({ queryKey: ['nfts'] })
        .flatMap(([, data]) => data?.items ?? [])
        .filter((item) => item.id === nft.id)
        .map((item) => item.version)
      const cartVersions = client
        .getQueriesData<CartItem[]>({ queryKey: ['cart'] })
        .flatMap(([, data]) => data ?? [])
        .filter((item) => item.nft.id === nft.id)
        .map((item) => item.nft.version)
      const currentVersion = Math.max(
        versions.get(nft.id) ?? 0,
        detail?.version ?? 0,
        ...catalogVersions,
        ...cartVersions,
      )
      // Comparamos também com o cache REST, não apenas com os eventos desta conexão.
      if (nft.version <= currentVersion) {
        setMessage(
          `Evento ${nft.version < currentVersion ? 'antigo' : 'duplicado'} de ${nft.name} descartado. Preço e estoque mantidos; versão recebida ${nft.version}, versão atual ${currentVersion}.`,
        )
        return
      }
      versions.set(nft.id, nft.version)
      void client.invalidateQueries({ queryKey: ['nfts'] })
      void client.invalidateQueries({ queryKey: ['nft', nft.id] })
      void client.invalidateQueries({ queryKey: ['cart'] })
      void client.invalidateQueries({ queryKey: ['quote'] })
      setMessage(
        `Preço atualizado: ${nft.name}, ${nft.price} ETH; ${nft.available} unidades disponíveis.`,
      )
    }
    const connect = () => {
      setConnected(true)
      void client.invalidateQueries({ queryKey: ['nfts'] })
      void client.invalidateQueries({ queryKey: ['nft'] })
      void client.invalidateQueries({ queryKey: ['cart'] })
      void client.invalidateQueries({ queryKey: ['quote'] })
      void client.invalidateQueries({ queryKey: ['order'] })
    }
    const disconnect = () => setConnected(false)
    const orderUpdate = (event: OrderUpdated) => {
      if (event.userId !== client.getQueryData<User | null>(['session'])?.id) return
      const key = ['order', event.userId, event.order.id]
      const previous = client.getQueryData<Order>(key)
      if (previous && (previous.version >= event.order.version || previous.status !== 'pending')) {
        setMessage(
          `Evento antigo ou duplicado do pedido ${event.order.id} descartado. Estado mantido: ${previous.status === 'confirmed' ? 'confirmado' : previous.status === 'declined' ? 'recusado' : 'pendente'}.`,
        )
        return
      }
      if (event.order.version < 1) {
        setMessage(
          `Evento antigo do pedido ${event.order.id} descartado. Abra o recibo para conferir o estado atual.`,
        )
        return
      }
      client.setQueryData(key, event.order)
      void client.invalidateQueries({ queryKey: ['cart'] })
    }
    socket.on('connect', connect)
    socket.on('disconnect', disconnect)
    socket.on('nft.updated', update)
    socket.on('order.updated', orderUpdate)
    socket.on('demo.result', setMessage)
    socket.connect()
    return () => {
      // Encerra os listeners inclusive quando o usuário muda.
      socket.off('connect', connect)
      socket.off('disconnect', disconnect)
      socket.off('nft.updated', update)
      socket.off('order.updated', orderUpdate)
      socket.off('demo.result', setMessage)
      socket.disconnect()
    }
  }, [client, socket, session.data?.id])

  return { socket, connected, message }
}
