import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { api, getErrorMessage } from '../lib/api'
import { Private } from '../account'
import { useSession } from '../hooks/use-session'
import type { Order } from '../contracts'
import { Button } from '../components/ui/button'
import { Summary } from '../components/cart-items'

function Receipt({ id }: { id: string }) {
  const navigate = useNavigate()
  const sessionQuery = useSession()
  const queryClient = useQueryClient()
  const orderKey = ['order', sessionQuery.data?.id, id]
  const orderQuery = useQuery({
    queryKey: orderKey,
    queryFn: async ({ signal }) => {
      const result = (await api.get<Order>(`/orders/${id}`, { signal })).data
      const previous = queryClient.getQueryData<Order>(orderKey)
      // Uma resposta REST atrasada não pode desfazer a confirmação recebida pelo socket.
      return previous && (previous.version > result.version || previous.status !== 'pending')
        ? previous
        : result
    },
    refetchInterval: (orderQuery) => (orderQuery.state.data?.status === 'pending' ? 2000 : false),
  })
  if (orderQuery.isPending) return <p role="status">Carregando pedido…</p>
  if (orderQuery.isError) return <p role="alert">{getErrorMessage(orderQuery.error)}</p>
  const order = orderQuery.data
  const titles = {
    confirmed: 'Seus NFTs agora estão na sua carteira',
    declined: 'Pagamento recusado',
    pending: 'Processando pagamento…',
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (open) return
        if (order.status === 'confirmed') {
          void navigate({
            to: '/',
            hash: 'catalogo',
            search: { q: '', category: '', network: '', sort: 'recent', page: 1 },
            replace: true,
          })
        } else {
          void navigate({ to: '/cart', replace: true })
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content receipt-modal">
          <Dialog.Close className="modal-close" aria-label="Fechar recibo">
            ×
          </Dialog.Close>
          {order.status !== 'declined' && (
            <h1 className="sr-only">
              {order.status === 'confirmed' ? 'Compra confirmada' : 'Pedido pendente'}
            </h1>
          )}
          {order.status === 'confirmed' && <span className="receipt-icon" aria-hidden="true" />}
          <Dialog.Title>{titles[order.status]}</Dialog.Title>
          <dl className="receipt-meta">
            <div>
              <dt>ID da transação</dt>
              <dd title={order.transaction}>{order.transaction.slice(0, 12)}…</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('pt-BR')
                  : 'Não registrada'}
              </dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{order.quote.total} ETH</dd>
            </div>
            <div>
              <dt>Carteira</dt>
              <dd>{order.wallet?.provider ?? 'Não registrada'}</dd>
            </div>
          </dl>
          <h2>Detalhes da transação</h2>
          <table className="receipt-items">
            <thead>
              <tr>
                <th>NFTs</th>
                <th>Edições</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.quote.items.map((item) => (
                <tr key={`${item.nft.id}-${item.edition}`}>
                  <td>
                    <div>
                      <img src={item.nft.image} alt="" width="72" height="72" />
                      <strong>{item.nft.name}</strong>
                    </div>
                  </td>
                  <td>× {item.quantity}</td>
                  <td>{item.lineSubtotal ? `${item.lineSubtotal} ETH` : 'Não registrado'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Summary quote={order.quote} />
          <Dialog.Description className="receipt-description" aria-live="polite">
            {order.status === 'pending'
              ? 'Aguardando confirmação. Você pode recarregar esta página para acompanhar o pedido.'
              : order.status === 'declined'
                ? 'Seus itens permanecem no carrinho.'
                : `Transação confirmada na ${order.wallet?.network ?? 'Ethereum'}. A propriedade foi transferida para sua carteira conectada e registrada na rede.`}
          </Dialog.Description>
          {order.status === 'confirmed' && (
            <Button disabled title="Transações simuladas não são registradas no Etherscan">
              Ver no Etherscan
            </Button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function OrderPage({ id }: { id: string }) {
  return (
    <Private>
      <Receipt id={id} />
    </Private>
  )
}
