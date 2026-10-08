import { useBlocker, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getErrorMessage } from './lib/api'
import { useSession } from './hooks/use-session'
import { useCart } from './hooks/use-cart'
import { Button } from './components/ui/button'
import { LoginModal } from './components/login-modal'

export function AuthNavigation() {
  const session = useSession()
  const blocker = useBlocker({
    shouldBlockFn: ({ next }) =>
      !session.data &&
      (['/checkout', '/profile', '/wallets', '/favorites'].includes(next.pathname) ||
        next.pathname.startsWith('/orders/')),
    withResolver: true,
    enableBeforeUnload: false,
  })

  return (
    <LoginModal
      open={blocker.status === 'blocked'}
      onClose={() => blocker.reset?.()}
      onAuthenticated={() => blocker.proceed?.()}
    />
  )
}

export function SessionNav() {
  const [loginOpen, setLoginOpen] = useState(false)
  const session = useSession()
  const navigate = useNavigate()
  const cart = useCart()
  const itemCount = cart.data?.reduce((total, item) => total + item.quantity, 0) ?? 0
  return (
    <div className="session-nav">
      <button
        type="button"
        className="search-trigger cart-trigger"
        aria-label="Carrinho"
        title={`Carrinho: ${itemCount} itens`}
        onClick={() => void navigate({ to: '/cart' })}
      >
        <span className="asset-icon cart-icon" aria-hidden="true" />
        {itemCount > 0 && (
          <span className="cart-count" aria-hidden="true">
            {itemCount}
          </span>
        )}
      </button>
      {session.data ? (
        <Button className="header-login" onClick={() => void navigate({ to: '/profile' })}>
          <span className="asset-icon user-icon" aria-hidden="true" />
          <span className="session-label">Meu perfil</span>
        </Button>
      ) : (
        <LoginModal
          open={loginOpen}
          onOpen={() => setLoginOpen(true)}
          onClose={() => setLoginOpen(false)}
          trigger={
            <Button className="header-login">
              <span className="asset-icon logout-icon" aria-hidden="true" />
              <span className="session-label">Entrar</span>
            </Button>
          }
        />
      )}
    </div>
  )
}

export function Private({ children }: { children: React.ReactNode }) {
  const session = useSession()
  const [loginOpen, setLoginOpen] = useState(false)
  useEffect(() => {
    if (session.isSuccess && !session.data) setLoginOpen(true)
  }, [session.isSuccess, session.data])
  if (session.isPending) return <p role="status">Verificando sessão…</p>
  if (session.isError && !session.data)
    return (
      <section>
        <p role="alert">{getErrorMessage(session.error)}</p>
        <Button onClick={() => void session.refetch()}>Tentar novamente</Button>
      </section>
    )
  if (!session.data) {
    return (
      <section>
        <h1>Entre para continuar</h1>
        <p>Seu carrinho permanece salvo.</p>
        <LoginModal
          open={loginOpen}
          onOpen={() => setLoginOpen(true)}
          onClose={() => setLoginOpen(false)}
          trigger={<Button>Entrar e retomar</Button>}
        />
      </section>
    )
  }
  return (
    <>
      {session.isError && (
        <div role="alert">
          Não foi possível atualizar a sessão. Seus dados continuam nesta tela.
          <Button onClick={() => void session.refetch()}>Tentar novamente</Button>
        </div>
      )}
      {children}
    </>
  )
}
