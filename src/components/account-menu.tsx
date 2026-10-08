import { useId, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { getErrorMessage } from '../lib/api'
import { useLogout } from '../hooks/use-session'
import { Button } from './ui/button'

export function AccountMenu() {
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const currentSection =
    pathname === '/wallets'
      ? 'Carteiras'
      : pathname === '/favorites'
        ? 'Lista de interesse'
        : 'Dados do perfil'
  return (
    <aside className="account-menu">
      <h2>Meu perfil</h2>
      <button
        type="button"
        className="account-menu-toggle"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
      >
        <span>Meu perfil · {currentSection}</span>
        <span className="asset-icon pagination-chevron" aria-hidden="true" />
      </button>
      <nav id={menuId} aria-label="Menu do perfil" data-open={open}>
        <Link to="/profile" onClick={() => setOpen(false)} activeProps={{ 'aria-current': 'page' }}>
          <span className="asset-icon user-icon" aria-hidden="true" />
          Dados do perfil
        </Link>
        <Link to="/wallets" onClick={() => setOpen(false)} activeProps={{ 'aria-current': 'page' }}>
          <span className="asset-icon location-icon" aria-hidden="true" />
          Carteiras
        </Link>
        <Link
          to="/favorites"
          onClick={() => setOpen(false)}
          activeProps={{ 'aria-current': 'page' }}
        >
          <span className="asset-icon heart-icon" aria-hidden="true" />
          Lista de interesse
        </Link>
        {[
          { label: 'Atividade', icon: 'cart-icon' },
          { label: 'Ofertas', icon: 'activity-icon' },
          { label: 'Arquivos baixados', icon: 'download-icon' },
          { label: 'Suporte', icon: 'danger-icon' },
        ].map(({ label, icon }) => (
          <Button key={label} variant="outline" disabled title="Página ainda indisponível">
            <span className={`asset-icon ${icon}`} aria-hidden="true" />
            {label}
          </Button>
        ))}
        <Button
          className="account-logout"
          variant="outline"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <span className="asset-icon logout-icon" aria-hidden="true" />
          Sair
        </Button>
        {logout.isError && <p role="alert">{getErrorMessage(logout.error)}</p>}
      </nav>
    </aside>
  )
}
