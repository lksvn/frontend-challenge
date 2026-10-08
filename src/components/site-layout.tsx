import { Link, Outlet, useSearch, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useMarketplaceEvents } from '../hooks/use-marketplace-events'
import { AuthNavigation, SessionNav } from '../account'
import { SiteFooter } from './site-footer'

function HeaderSearch() {
  const search = useSearch({ strict: false })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) setTerm(search.q ?? '')
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className="search-trigger" aria-label="Abrir busca">
          <span className="asset-icon search-icon" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label="Buscar NFTs">
        <form
          role="search"
          aria-label="Busca de NFTs"
          onSubmit={(event) => {
            event.preventDefault()
            setOpen(false)
            void navigate({
              to: '/',
              search: {
                category: '',
                network: '',
                sort: 'recent',
                ...(pathname === '/' ? search : {}),
                q: term.trim(),
                page: 1,
              },
              resetScroll: pathname !== '/',
            })
          }}
        >
          <label htmlFor="nft-search">Buscar NFTs</label>
          <div className="search-input-row">
            <input
              id="nft-search"
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Nome do NFT"
            />
            <Button type="submit">Buscar</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

export function SiteLayout() {
  useMarketplaceEvents()
  const location = useRouterState({ select: (state) => state.location })
  const pathname = location.pathname
  const hash = location.hash.replace(/^#/, '')
  const activeItem = pathname.startsWith('/nfts/')
    ? 'catalogo'
    : pathname === '/'
      ? hash || 'home'
      : ''
  return (
    <>
      <header className="site-header">
        <Link
          to="/"
          search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
          className="brand"
        >
          KURIO
        </Link>
        <nav aria-label="Principal">
          <Link
            to="/"
            hash=""
            activeOptions={{ exact: true, includeHash: true, includeSearch: false }}
            search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
            aria-current={activeItem === 'home' ? 'page' : undefined}
          >
            Início
          </Link>
          <a
            href={`${import.meta.env.BASE_URL}#catalogo`}
            aria-current={activeItem === 'catalogo' ? 'location' : undefined}
          >
            Mercado
          </a>
          <a
            href={`${import.meta.env.BASE_URL}#criadores`}
            aria-current={activeItem === 'criadores' ? 'location' : undefined}
          >
            Criadores
          </a>
          <a
            href={`${import.meta.env.BASE_URL}#aprenda`}
            aria-current={activeItem === 'aprenda' ? 'location' : undefined}
          >
            Aprenda
          </a>
        </nav>
        <div className="header-actions">
          <div className="mobile-nav-start">
            <Link
              to="/"
              search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
              aria-label="Início"
              aria-current={activeItem === 'home' ? 'page' : undefined}
            >
              <span className="asset-icon mobile-home-icon" aria-hidden="true" />
            </Link>
            <Link
              to="/favorites"
              aria-label="Favoritos"
              aria-current={pathname === '/favorites' ? 'page' : undefined}
            >
              <span className="asset-icon heart-filled-icon" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="mobile-central-action"
              disabled
              aria-label="Ação central indisponível"
              title="Ação ainda indisponível"
            >
              <span className="asset-icon mobile-scan-icon" aria-hidden="true" />
            </button>
          </div>
          <HeaderSearch />
          <SessionNav />
        </div>
      </header>
      <main
        className={
          pathname.startsWith('/nfts/')
            ? 'mobile-detail-view'
            : pathname === '/cart'
              ? 'mobile-cart-view'
              : pathname === '/checkout'
                ? 'mobile-payment-view'
                : pathname === '/wallets'
                  ? 'mobile-wallets-view'
                  : pathname === '/profile'
                    ? 'mobile-profile-view'
                    : pathname === '/favorites'
                      ? 'mobile-favorites-view'
                      : undefined
        }
      >
        <Outlet />
        {/* <RealtimeDemo /> */}
      </main>
      <SiteFooter />
      <AuthNavigation />
    </>
  )
}
