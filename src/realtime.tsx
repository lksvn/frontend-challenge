import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import type { DemoState } from './contracts'
import { Button } from './components/ui/button'
import { api, getErrorMessage as errorMessage } from './lib/api'
import { useMarketplaceEvents } from './hooks/use-marketplace-events'

export function RealtimeDemo() {
  const client = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [targetId, setTargetId] = useState('1')
  const getDemoState = async (request: Promise<{ data: DemoState }>) => {
    const { data } = await request
    if (!data || !Array.isArray(data.nfts) || !Array.isArray(data.scenarios)) {
      throw new Error(
        'Painel de testes desatualizado. Recarregue a página para atualizar os mocks.',
      )
    }
    return data
  }
  const demo = useQuery({
    queryKey: ['demo'],
    queryFn: ({ signal }) => getDemoState(api.get<DemoState>('/demo/state', { signal })),
  })
  const scenario = useMutation({
    mutationFn: (value: string) =>
      getDemoState(api.post<DemoState>('/demo/scenario', { scenario: value })),
    onSuccess: async (result) => {
      client.setQueryData(['demo'], result)
      await client.invalidateQueries()
    },
  })
  const reset = useMutation({
    mutationFn: () => api.post('/demo/reset'),
    onSuccess: () => {
      sessionStorage.clear()
      localStorage.removeItem('kurio.coupon')
      window.location.assign(import.meta.env.BASE_URL)
    },
  })
  const { socket, connected, message } = useMarketplaceEvents()

  useEffect(() => {
    if (pathname.startsWith('/nfts/')) setTargetId(pathname.split('/')[2])
  }, [pathname])

  return (
    <aside className="demo-panel" aria-label="Demonstração de tempo real">
      <details>
        <summary>
          Testes
          <span>Socket.IO: {connected ? 'conectado' : 'desconectado'}</span>
        </summary>
        <div className="demo-controls">
          <label>
            NFT da simulação
            <select
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              disabled={!demo.data}
            >
              {demo.data?.nfts.map((nft) => (
                <option key={nft.id} value={nft.id}>
                  {nft.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={!connected}
            onClick={() => socket.emit('demo.update', { nftId: targetId })}
          >
            Simular mudança de preço
          </Button>
          <Button
            variant="outline"
            disabled={!connected}
            onClick={() => socket.emit('demo.stock', { nftId: targetId })}
          >
            Simular esgotamento
          </Button>
          <Button
            variant="outline"
            disabled={!connected}
            onClick={() => socket.emit('demo.delayed-update', { nftId: targetId })}
          >
            Atualizar preço em 2s
          </Button>
          <Button
            variant="outline"
            disabled={!connected}
            onClick={() => socket.emit('demo.duplicate', { nftId: targetId })}
          >
            Evento duplicado
          </Button>
          <Button
            variant="outline"
            disabled={!connected}
            onClick={() => socket.emit('demo.old', { nftId: targetId })}
          >
            Evento antigo
          </Button>
          <Button
            variant="outline"
            disabled={!connected}
            onClick={() =>
              socket.emit('demo.old-order', {
                orderId: pathname.startsWith('/orders/') ? pathname.split('/')[2] : undefined,
              })
            }
          >
            Evento antigo de pedido
          </Button>
          <Button
            variant="outline"
            onClick={() => (connected ? socket.disconnect() : socket.connect())}
          >
            {connected ? 'Interromper conexão' : 'Reconectar'}
          </Button>
          <label>
            Cenário de demonstração
            <select
              value={demo.data?.scenario ?? ''}
              disabled={!demo.data || scenario.isPending}
              onChange={(event) => {
                const panel = event.currentTarget.closest('details')
                if (panel) panel.open = false
                scenario.mutate(event.target.value)
              }}
            >
              {demo.data?.scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>
            Resetar demonstração
          </Button>
          <p>{demo.data?.scenarios.find((item) => item.id === demo.data.scenario)?.description}</p>
          <p>
            Eventos antigos e duplicados devem manter os dados atuais. O resultado do descarte
            aparece abaixo.
          </p>
          <p role="alert">
            {scenario.isError
              ? errorMessage(scenario.error)
              : reset.isError
                ? errorMessage(reset.error)
                : demo.isError
                  ? demo.error.message
                  : ''}
          </p>
        </div>
      </details>
      <span role="status">{message}</span>
    </aside>
  )
}
