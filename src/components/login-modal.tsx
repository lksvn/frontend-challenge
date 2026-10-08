import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Dialog, Tabs } from 'radix-ui'
import { api, getErrorMessage } from '../lib/api'
import type { User } from '../contracts'
import { Button } from './ui/button'
import { PasswordField } from './password-field'

export function LoginModal({
  open,
  onClose,
  onOpen,
  onAuthenticated,
  trigger,
  initialRegister = false,
}: {
  open: boolean
  onClose: () => void
  onOpen?: () => void
  onAuthenticated?: () => void
  trigger?: React.ReactNode
  initialRegister?: boolean
}) {
  const [tab, setTab] = useState(initialRegister ? 'register' : 'login')
  const [notice, setNotice] = useState('')
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (value) {
          setTab(initialRegister ? 'register' : 'login')
          setNotice('')
          onOpen?.()
        } else onClose()
      }}
    >
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay login-overlay" />
        <Dialog.Content
          className={`dialog-content login-modal ${tab === 'register' ? 'signup-modal' : ''}`}
        >
          <Dialog.Title className="sr-only">Entrar na Kurio</Dialog.Title>
          <Dialog.Close className="modal-close" aria-label="Fechar login">
            ×
          </Dialog.Close>
          <div className="auth-mobile-brand" aria-hidden="true">
            KURIO
          </div>
          <h2 className="auth-mobile-title">
            {tab === 'register' ? 'Criar perfil de colecionador' : 'Entrar'}
          </h2>
          <Tabs.Root
            value={tab}
            onValueChange={(value) => {
              setTab(value)
              setNotice('')
            }}
          >
            <Tabs.List className="auth-tabs" aria-label="Acesso à conta">
              <Tabs.Trigger value="login">Entrar</Tabs.Trigger>
              <span className="auth-tab-divider" aria-hidden="true" />
              <Tabs.Trigger value="register">Criar conta</Tabs.Trigger>
            </Tabs.List>
            <Dialog.Description className="auth-description">
              {tab === 'register'
                ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
                : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
            </Dialog.Description>
            {notice && <p role="status">{notice}</p>}
            <Tabs.Content value="login">
              <AuthForm onAuthenticated={onAuthenticated ?? onClose} />
            </Tabs.Content>
            <Tabs.Content value="register">
              <AuthForm
                register
                onRegistered={() => {
                  setTab('login')
                  setNotice('Conta criada. Entre com seu e-mail e senha.')
                }}
              />
            </Tabs.Content>
          </Tabs.Root>
          <button
            className="auth-mobile-switch"
            type="button"
            onClick={() => {
              setTab(tab === 'register' ? 'login' : 'register')
              setNotice('')
            }}
          >
            {tab === 'register' ? 'Já tem uma conta? Entre' : 'Novo na Kurio? Crie uma conta'}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function AuthForm({
  register = false,
  onAuthenticated,
  onRegistered,
}: {
  register?: boolean
  onAuthenticated?: () => void
  onRegistered?: () => void
}) {
  const queryClient = useQueryClient()
  const submitCredentials = useMutation({
    mutationFn: (data: Record<string, FormDataEntryValue>) =>
      api.post<User>(register ? '/register' : '/login', data),
    onSuccess: async (response) => {
      await queryClient.cancelQueries()
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
      queryClient.setQueryData(['session'], register ? null : response.data)
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      if (register) onRegistered?.()
      else onAuthenticated?.()
    },
  })
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    submitCredentials.mutate(register ? { ...data, name: data.username } : data)
  }
  return (
    <section className="auth-form">
      <form onSubmit={handleSubmit}>
        {register && (
          <label>
            <span className="sr-only">Nome de usuário</span>
            <input
              aria-describedby="auth-error"
              name="username"
              placeholder="Nome de usuário"
              required
              pattern="[a-zA-Z0-9_]{3,30}"
              autoComplete="username"
            />
          </label>
        )}
        <label>
          <span className="sr-only">E-mail</span>
          <input
            aria-describedby="auth-error"
            name="email"
            type="email"
            placeholder={register ? 'Digite seu e-mail' : 'contato@email.com'}
            required
            autoComplete="email"
          />
        </label>
        <PasswordField
          label="Senha"
          placeholder="Senha"
          name="password"
          required
          minLength={8}
          autoComplete={register ? 'new-password' : 'current-password'}
          aria-describedby="auth-error"
        />
        {register && (
          <PasswordField
            label="Confirmar senha"
            placeholder="Confirmar senha"
            name="confirm"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="auth-error"
          />
        )}
        <p id="auth-error" role="alert">
          {submitCredentials.isError ? getErrorMessage(submitCredentials.error) : ''}
        </p>
        {!register && (
          <a role="link" aria-disabled="true" title="Recuperação de senha ainda indisponível">
            Esqueceu a senha?
          </a>
        )}
        <Button disabled={submitCredentials.isPending}>
          {submitCredentials.isPending ? (
            'Aguarde…'
          ) : register ? (
            <>
              <span className="auth-desktop-submit">Criar conta</span>
              <span className="auth-mobile-submit">Criar perfil</span>
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
      <div className="auth-divider">
        <span>Ou continue com</span>
      </div>
      <div className="auth-socials">
        <Button variant="outline" disabled title="Login social ainda indisponível">
          <img src={`${import.meta.env.BASE_URL}assets/google.svg`} alt="" width="20" height="20" />
          Continuar com Google
        </Button>
        <Button variant="outline" disabled title="Login social ainda indisponível">
          <span className="asset-icon auth-facebook-icon" aria-hidden="true" />
          Continuar com Facebook
        </Button>
      </div>
    </section>
  )
}
