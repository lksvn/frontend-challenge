import { CouponField } from '../components/coupon-field'
import { useCoupon } from '../hooks/use-coupon'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Dialog } from 'radix-ui'
import { AxiosError } from 'axios'
import { api, getErrorMessage } from '../lib/api'
import { Private } from '../account'
import { useSession } from '../hooks/use-session'
import { useCart } from '../hooks/use-cart'
import type { ApiError, Order, Quote, Wallet, WalletConnection } from '../contracts'
import { Button } from '../components/ui/button'
import { Summary } from '../components/cart-items'
import { PaymentItems } from '../components/payment-items'
import { CollectorFields } from '../components/collector-fields'

interface PurchaseAttempt {
  key: string
  userId: string
  quoteId: string
  walletId: string
  collector: Record<string, string>
}

function readPurchaseAttempt(userId: string | undefined): PurchaseAttempt | null {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem('kurio.attempt') ?? 'null',
    ) as PurchaseAttempt | null
    return saved?.userId === userId ? saved : null
  } catch {
    return null
  }
}

function Checkout() {
  const { coupon, applyCoupon } = useCoupon()
  const [collectorOpen, setCollectorOpen] = useState(false)
  const [couponOpen, setCouponOpen] = useState(Boolean(coupon))
  const sessionQuery = useSession()
  const cartQuery = useCart()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()
  const [selectedWalletId, setWalletId] = useState<string | null>(null)
  const walletsQuery = useQuery({
    queryKey: ['wallets', sessionQuery.data?.id],
    queryFn: async ({ signal }) => (await api.get<Wallet[]>('/wallets', { signal })).data,
  })
  const walletId = selectedWalletId ?? walletsQuery.data?.find((wallet) => wallet.primary)?.id ?? ''
  const selectedWallet = walletsQuery.data?.find((wallet) => wallet.id === walletId)
  const [connected, setConnected] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const walletConnection = useMutation({
    mutationFn: async (action: 'connect' | 'decline' | 'disconnect') =>
      (await api.post<WalletConnection>(`/wallets/${walletId}/connection`, { action })).data,
    onMutate: () => setConnected(false),
    onSuccess: (result) => {
      setConnected(result.connected)
      setConnectionMessage(result.message)
    },
  })
  const quoteQuery = useQuery({
    queryKey: ['quote', sessionQuery.data?.id, cartQuery.data, coupon],
    enabled: Boolean(cartQuery.data),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === sessionQuery.data?.id ? previous : undefined,
    queryFn: async () => (await api.post<Quote>('/quote', { coupon: coupon })).data,
    retry: false,
  })
  const [purchaseAttempt, setPurchaseAttempt] = useState(() =>
    readPurchaseAttempt(sessionQuery.data?.id),
  )
  const createOrder = useMutation({
    mutationFn: async (current: PurchaseAttempt) =>
      (
        await api.post<Order>(
          '/orders',
          { quoteId: current.quoteId, walletId: current.walletId, collector: current.collector },
          { headers: { 'Idempotency-Key': current.key } },
        )
      ).data,
    onSuccess: async (order) => {
      queryClient.setQueryData(['order', order.userId, order.id], order)
      sessionStorage.removeItem('kurio.attempt')
      await navigate({ to: '/orders/$id', params: { id: order.id } })
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      if (
        error instanceof AxiosError &&
        (error.response?.data as ApiError)?.code === 'QUOTE_CHANGED'
      ) {
        sessionStorage.removeItem('kurio.attempt')
        setPurchaseAttempt(null)
        await quoteQuery.refetch()
      }
    },
  })
  const confirmPurchase = (collector: Record<string, string>) => {
    const quote = quoteQuery.data
    if (!quote || quoteQuery.isFetching || createOrder.isPending || !connected) return
    const current = purchaseAttempt ?? {
      key: crypto.randomUUID(),
      userId: sessionQuery.data!.id,
      quoteId: quote.id,
      walletId,
      collector,
    }
    // A mesma chave e os mesmos dados recuperam a compra depois de um timeout.
    setPurchaseAttempt(current)
    sessionStorage.setItem('kurio.attempt', JSON.stringify(current))
    createOrder.mutate(current)
  }
  return (
    <section className="payment-page">
      <div className="mobile-payment-heading mobile-page-heading">
        <Button
          variant="outline"
          aria-label="Voltar ao carrinho"
          onClick={() => {
            if (router.history.canGoBack()) router.history.back()
            else void navigate({ to: '/cart', replace: true })
          }}
        >
          <span className="asset-icon pagination-chevron" aria-hidden="true" />
        </Button>
        <h1>Pagamento com carteira</h1>
      </div>
      <nav className="detail-breadcrumb" aria-label="Navegação estrutural">
        <Link to="/" search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}>
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <a href={`${import.meta.env.BASE_URL}#catalogo`}>Mercado</a>
        <span aria-hidden="true">/</span>
        <span>Pagamento</span>
      </nav>
      {purchaseAttempt ? (
        <div>
          <p>
            Existe uma tentativa de compra em recuperação. Reenvie a mesma tentativa para consultar
            seu resultado.
          </p>
          <Button
            disabled={createOrder.isPending}
            onClick={() => createOrder.mutate(purchaseAttempt)}
          >
            Recuperar pedido
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const collector: Record<string, string> = {}
            for (const [field, value] of new FormData(event.currentTarget)) {
              collector[field] = String(value)
            }
            confirmPurchase(collector)
          }}
          onInvalidCapture={(event) => {
            if (event.target instanceof HTMLElement && event.target.closest('.collector-panel')) {
              flushSync(() => setCollectorOpen(true))
            }
          }}
          className="payment-layout"
        >
          <section className="collector-panel" data-open={collectorOpen}>
            <button
              type="button"
              className="collector-toggle"
              aria-expanded={collectorOpen}
              aria-controls="collector-panel-content"
              onClick={() => setCollectorOpen(!collectorOpen)}
            >
              Dados do coletor
            </button>
            <div id="collector-panel-content" className="collector-panel-content">
              <CollectorFields
                user={sessionQuery.data}
                wallets={walletsQuery.data}
                selectedWallet={selectedWallet}
                onWalletChange={(id) => {
                  setWalletId(id)
                  setConnected(false)
                }}
              />
            </div>
          </section>
          <aside className="payment-summary">
            <h2>Seus NFTs</h2>
            {cartQuery.data && <PaymentItems items={cartQuery.data} />}
            {couponOpen ? (
              <CouponField
                coupon={coupon}
                onApply={(value) => {
                  applyCoupon(value)
                  if (!value) setCouponOpen(false)
                }}
                pending={quoteQuery.isFetching}
              />
            ) : (
              <button
                type="button"
                className="payment-coupon-link"
                onClick={() => setCouponOpen(true)}
              >
                Tem um código promocional? Aplique aqui
              </button>
            )}
            {cartQuery.isError && (
              <div>
                <p role="alert">{getErrorMessage(cartQuery.error)}</p>
                <Button type="button" onClick={() => void cartQuery.refetch()}>
                  Tentar novamente
                </Button>
              </div>
            )}
            {quoteQuery.isPending ? (
              <div className="skeleton" aria-label="Carregando resumo" />
            ) : quoteQuery.data ? (
              <Summary quote={quoteQuery.data} cart />
            ) : (
              <p role="alert">{getErrorMessage(quoteQuery.error)}</p>
            )}
            <fieldset className="payment-wallets">
              <legend>
                <span className="payment-desktop-label">Carteira e rede</span>
                <span className="payment-mobile-label payment-wallet-heading">
                  Carteira conectada
                  <button
                    type="button"
                    onClick={() => void navigate({ to: '/wallets', search: { from: 'checkout' } })}
                  >
                    Trocar carteira
                  </button>
                </span>
              </legend>
              {walletsQuery.data?.map((wallet) => (
                <label key={wallet.id}>
                  <input
                    type="radio"
                    name="selectedWallet"
                    value={wallet.id}
                    checked={walletId === wallet.id}
                    required
                    disabled={walletConnection.isPending}
                    onChange={() => {
                      setWalletId(wallet.id)
                      setConnected(false)
                    }}
                  />
                  <span className="payment-desktop-label">
                    {wallet.provider} · {wallet.network} · {wallet.address.slice(0, 8)}…
                  </span>
                  <span className="payment-mobile-label payment-wallet-card">
                    <strong>
                      {wallet.nickname || (wallet.primary ? 'Principal' : 'Carteira')}
                    </strong>
                    <span>
                      {wallet.ens || `${wallet.address.slice(0, 8)}…${wallet.address.slice(-4)}`}
                    </span>
                    <span>Rede {wallet.network}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <Button
              className="payment-desktop-label"
              type="button"
              variant="outline"
              onClick={() => void navigate({ to: '/wallets', search: { from: 'checkout' } })}
            >
              Cadastrar ou editar carteira
            </Button>
            <div className="payment-connection">
              <h2 className="payment-mobile-label">Carteira e rede</h2>
              {selectedWallet && (
                <p className="payment-mobile-label payment-provider">
                  {selectedWallet.provider} · {selectedWallet.network}
                </p>
              )}
              <p>Conexão simulada: {connected ? 'conectada' : 'desconectada'}</p>
              <div className="actions">
                <Button
                  type="button"
                  disabled={!walletId || walletConnection.isPending}
                  onClick={() => walletConnection.mutate('connect')}
                >
                  Conectar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!walletId || walletConnection.isPending}
                  onClick={() => walletConnection.mutate('decline')}
                >
                  Simular recusa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!walletId || walletConnection.isPending}
                  onClick={() => walletConnection.mutate('disconnect')}
                >
                  Desconectar
                </Button>
              </div>
              <p role="status">{connectionMessage}</p>
              <p id="wallet-connection-error" role="alert">
                {walletConnection.isError
                  ? getErrorMessage(walletConnection.error)
                  : walletsQuery.isError
                    ? getErrorMessage(walletsQuery.error)
                    : ''}
              </p>
            </div>
            <div className="payment-actions">
              <Button
                className="mobile-primary-action payment-confirm"
                disabled={
                  !connected ||
                  createOrder.isPending ||
                  quoteQuery.isFetching ||
                  !cartQuery.data?.length ||
                  cartQuery.isError ||
                  quoteQuery.isError
                }
              >
                Confirmar compra
              </Button>
            </div>
          </aside>
        </form>
      )}
      <p id="checkout-error" role="alert">
        {createOrder.isError ? getErrorMessage(createOrder.error) : ''}
      </p>
      <Dialog.Root open={createOrder.isPending}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content receipt-modal">
            <Dialog.Title>Processando pagamento…</Dialog.Title>
            <Dialog.Description>Aguardando confirmação da transação.</Dialog.Description>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}

export function CheckoutPage() {
  return (
    <Private>
      <Checkout />
    </Private>
  )
}
