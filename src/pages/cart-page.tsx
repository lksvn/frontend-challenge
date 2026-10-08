import { CartSkeleton } from '../components/cart-skeleton'
import { CouponField } from '../components/coupon-field'
import { useCoupon } from '../hooks/use-coupon'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { api, getErrorMessage } from '../lib/api'
import { useSession } from '../hooks/use-session'
import { useCart } from '../hooks/use-cart'
import type { Quote } from '../contracts'
import { Button } from '../components/ui/button'
import { CartItems, Summary } from '../components/cart-items'
import { CartRecommendations } from '../components/cart-recommendations'

export function CartPage() {
  const cartQuery = useCart()
  const sessionQuery = useSession()
  const navigate = useNavigate()
  const router = useRouter()
  const { coupon, applyCoupon } = useCoupon()
  const cartOwner = sessionQuery.data?.id ?? 'guest'
  const quoteQuery = useQuery({
    queryKey: ['quote', cartOwner, cartQuery.data, coupon],
    // Mantém o resumo durante o recálculo, sem reutilizar dados de outra conta.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === cartOwner ? previous : undefined,
    enabled: Boolean(cartQuery.data),
    queryFn: async () => (await api.post<Quote>('/quote', { coupon })).data,
    retry: false,
  })
  return (
    <section className="cart-page">
      <div className="mobile-cart-heading mobile-page-heading">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => {
            if (router.history.canGoBack()) router.history.back()
            else
              void navigate({
                to: '/',
                search: { q: '', category: '', network: '', sort: 'recent', page: 1 },
              })
          }}
        >
          <span className="asset-icon pagination-chevron" aria-hidden="true" />
        </button>
        <h1>Carrinho de NFTs</h1>
        <Link
          className="cart-home"
          to="/"
          hash="catalogo"
          search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
          aria-label="Voltar ao início"
        >
          <span className="asset-icon mobile-home-icon" aria-hidden="true" />
        </Link>
      </div>
      <nav className="breadcrumb" aria-label="Navegação estrutural">
        <Link to="/" search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}>
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to="/"
          hash="catalogo"
          search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
        >
          Mercado
        </Link>
        <span aria-hidden="true">/</span>
        <span>Carrinho</span>
      </nav>
      {cartQuery.isError && cartQuery.data && (
        <div role="alert">
          Não foi possível atualizar o carrinho. Seus itens continuam nesta tela.
          <Button onClick={() => void cartQuery.refetch()}>Tentar novamente</Button>
        </div>
      )}
      {cartQuery.isPending ? (
        <CartSkeleton />
      ) : !cartQuery.data ? (
        <div role="alert">
          <p>{getErrorMessage(cartQuery.error)}</p>
          <Button onClick={() => void cartQuery.refetch()} disabled={cartQuery.isFetching}>
            Tentar novamente
          </Button>
        </div>
      ) : !cartQuery.data.length ? (
        <div className="cart-empty">
          <p role="status">Seu carrinho está vazio.</p>
          <Button asChild>
            <Link
              to="/"
              hash="catalogo"
              search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
            >
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : (
        <div className="cart-layout">
          <CartItems items={cartQuery.data} editable />
          <aside className="cart-summary" aria-busy={quoteQuery.isFetching}>
            <h2>Resumo da carteira</h2>
            <CouponField coupon={coupon} onApply={applyCoupon} pending={quoteQuery.isFetching} />
            {quoteQuery.isPending ? (
              <Summary cart />
            ) : quoteQuery.isError ? (
              <div role="alert">
                <p>{getErrorMessage(quoteQuery.error)}</p>
                <Button onClick={() => void quoteQuery.refetch()} disabled={quoteQuery.isFetching}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <Summary quote={quoteQuery.data} cart />
            )}
            <Button
              className="mobile-primary-action"
              disabled={!quoteQuery.data || quoteQuery.isError || quoteQuery.isFetching}
              onClick={() => void navigate({ to: '/checkout' })}
            >
              Conectar e finalizar
            </Button>
            <Link
              className="cart-continue"
              to="/"
              hash="catalogo"
              search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
            >
              Continuar explorando
            </Link>
          </aside>
        </div>
      )}
      <CartRecommendations />
    </section>
  )
}
