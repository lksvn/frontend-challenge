import { Link } from '@tanstack/react-router'
import { getErrorMessage } from '../lib/api'
import { useLogout } from '../hooks/use-session'
import { Button } from './ui/button'

export function AccountMenu() {
  const logout = useLogout()
  return (
    <aside className="account-menu">
      <h2>Meu perfil</h2>
      <Link to="/profile" activeProps={{ 'aria-current': 'page' }}>
        <span className="asset-icon user-icon" aria-hidden="true" />
        Dados do perfil
      </Link>
      <Link to="/wallets" activeProps={{ 'aria-current': 'page' }}>
        <span className="asset-icon location-icon" aria-hidden="true" />
        Carteiras
      </Link>
      {[
        { label: 'Atividade', icon: 'cart-icon' },
        { label: 'Lista de interesse', icon: 'heart-icon' },
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
    </aside>
  )
}
