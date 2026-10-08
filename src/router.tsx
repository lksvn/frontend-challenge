import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  lazyRouteComponent,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { getErrorMessage } from './lib/api'
import type { CatalogSearch } from './contracts'
import { Button } from './components/ui/button'
import { SiteLayout } from './components/site-layout'
import { LoginModal } from './components/login-modal'
import { CatalogPage } from './pages/catalog-page'
import { NftDetailPage } from './pages/nft-detail-page'
import { OrderPage } from './pages/order-page'

const root = createRootRoute({
  component: SiteLayout,
  notFoundComponent: () => (
    <section>
      <h1>Página não encontrada</h1>
      <Link to="/" search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}>
        Voltar ao início
      </Link>
    </section>
  ),
})
const home = createRoute({
  getParentRoute: () => root,
  path: '/',
  beforeLoad: ({ search, location }) => {
    const params = new URLSearchParams(location.searchStr)
    const defaults = {
      view: 'all',
      q: '',
      category: '',
      network: '',
      sort: 'recent',
      page: '1',
      min: '',
      max: '',
    }
    if (
      Object.entries(defaults).some(([key, value]) => params.has(key) && params.get(key) === value)
    ) {
      throw redirect({ to: '/', search, replace: true, resetScroll: false })
    }
  },
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    view: search.view === 'new' || search.view === 'trending' ? search.view : 'all',
    q: typeof search.q === 'string' ? search.q : '',
    category: typeof search.category === 'string' ? search.category : '',
    network: typeof search.network === 'string' ? search.network : '',
    sort: search.sort === 'price-asc' || search.sort === 'price-desc' ? search.sort : 'recent',
    page: Math.max(1, Math.floor(Number(search.page)) || 1),
    min: typeof search.min === 'string' ? search.min : '',
    max: typeof search.max === 'string' ? search.max : '',
  }),
  search: {
    middlewares: [
      stripSearchParams({
        view: 'all',
        q: '',
        category: '',
        network: '',
        sort: 'recent',
        page: 1,
        min: '',
        max: '',
      }),
    ],
  },
  component: CatalogPage,
})

const detail = createRoute({
  getParentRoute: () => root,
  path: '/nfts/$id',
  component: () => <NftDetailPage id={detail.useParams().id} />,
})
function AuthRoute({ register = false }: { register?: boolean }) {
  return (
    <>
      <CatalogPage />
      <LoginModal
        open
        initialRegister={register}
        onClose={() =>
          void router.navigate({
            to: '/',
            search: { q: '', category: '', network: '', sort: 'recent', page: 1 },
            resetScroll: false,
          })
        }
      />
    </>
  )
}
const login = createRoute({
  getParentRoute: () => root,
  path: '/login',
  component: AuthRoute,
})
const register = createRoute({
  getParentRoute: () => root,
  path: '/register',
  component: () => <AuthRoute register />,
})
const cart = createRoute({
  getParentRoute: () => root,
  path: '/cart',
  component: lazyRouteComponent(() => import('./pages/cart-page'), 'CartPage'),
})
const checkout = createRoute({
  getParentRoute: () => root,
  path: '/checkout',
  component: lazyRouteComponent(() => import('./pages/checkout-page'), 'CheckoutPage'),
})
const profile = createRoute({
  getParentRoute: () => root,
  path: '/profile',
  component: lazyRouteComponent(() => import('./pages/profile-page'), 'ProfilePage'),
})
const wallets = createRoute({
  getParentRoute: () => root,
  path: '/wallets',
  validateSearch: (search: Record<string, unknown>): { from?: 'checkout' } => ({
    from: search.from === 'checkout' ? 'checkout' : undefined,
  }),
  component: lazyRouteComponent(() => import('./pages/wallets-page'), 'WalletsPage'),
})
const favorites = createRoute({
  getParentRoute: () => root,
  path: '/favorites',
  component: lazyRouteComponent(() => import('./pages/favorites-page'), 'FavoritesPage'),
})
const order = createRoute({
  getParentRoute: () => root,
  path: '/orders/$id',
  component: () => <OrderPage id={order.useParams().id} />,
})
export const router = createRouter({
  basepath: import.meta.env.BASE_URL,
  defaultErrorComponent: ({ error }) => (
    <section>
      <h1>Não foi possível abrir esta página</h1>
      <p role="alert">{getErrorMessage(error)}</p>
      <Button onClick={() => void router.invalidate()}>Tentar novamente</Button>
    </section>
  ),
  search: { strict: true },
  parseSearch: (search) => Object.fromEntries(new URLSearchParams(search)),
  stringifySearch: (search) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
    }
    const query = params.toString()
    return query ? `?${query}` : ''
  },
  scrollRestoration: true,
  routeTree: root.addChildren([
    home,
    detail,
    login,
    register,
    cart,
    checkout,
    profile,
    wallets,
    favorites,
    order,
  ]),
})
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
