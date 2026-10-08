import { SuccessMessage } from '../components/success-message'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter, useNavigate } from '@tanstack/react-router'
import { api, getErrorMessage } from '../lib/api'
import { Private } from '../account'
import { useSession } from '../hooks/use-session'
import { Button } from '../components/ui/button'
import { AccountMenu } from '../components/account-menu'
import { EnsField } from '../components/ens-field'
import { PasswordField } from '../components/password-field'
import type { User } from '../contracts'

function Profile() {
  const router = useRouter()
  const navigate = useNavigate()
  const sessionQuery = useSession()
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: ['profile', sessionQuery.data?.id],
    queryFn: async ({ signal }) => (await api.get<User>('/profile', { signal })).data,
  })
  const [avatar, setAvatar] = useState(sessionQuery.data?.avatar ?? '')
  const [fileError, setFileError] = useState('')
  const saveProfile = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch<User>('/profile', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
  const changePassword = useMutation({
    mutationFn: (data: Record<string, FormDataEntryValue>) => api.post('/profile/password', data),
  })
  if (profileQuery.isPending) return <p role="status">Carregando perfil…</p>
  if (!profileQuery.data) return <p role="alert">{getErrorMessage(profileQuery.error)}</p>
  return (
    <section className="account-layout profile-page">
      <div className="mobile-page-heading">
        <Button
          variant="outline"
          aria-label="Voltar"
          onClick={() => {
            if (router.history.canGoBack()) router.history.back()
            else
              void navigate({
                to: '/',
                search: { q: '', category: '', network: '', sort: 'recent', page: 1 },
                replace: true,
              })
          }}
        >
          <span className="asset-icon pagination-chevron" aria-hidden="true" />
        </Button>
        <h1>Meu perfil</h1>
      </div>
      <AccountMenu />
      <div>
        <h1>Perfil do colecionador</h1>
        <div className="profile-layout">
          <form
            id="profile-form"
            className="profile-fields"
            onSubmit={(event) => {
              event.preventDefault()
              saveProfile.reset()
              changePassword.reset()
              const form = event.currentTarget
              const { current, password, confirm, ...profile } = Object.fromEntries(
                new FormData(form),
              )
              const save = () => saveProfile.mutate({ ...profile, avatar })
              if (current || password || confirm) {
                changePassword.mutate(
                  { current, password, confirm },
                  {
                    onSuccess: () => {
                      for (const name of ['current', 'password', 'confirm']) {
                        const input = form.elements.namedItem(name) as HTMLInputElement
                        input.value = ''
                      }
                      save()
                    },
                  },
                )
              } else {
                save()
              }
            }}
          >
            <label>
              <span className="account-field-label">Nome de exibição</span>
              <input
                aria-describedby="profile-error"
                name="name"
                required
                defaultValue={sessionQuery.data?.name}
              />
            </label>
            <label>
              <span className="account-field-label">Nome de usuário</span>
              <input
                aria-describedby="profile-error"
                name="username"
                required
                pattern="[a-zA-Z0-9_]{3,30}"
                defaultValue={sessionQuery.data?.username}
              />
            </label>
            <label>
              <span className="account-field-label">E-mail</span>
              <input
                aria-describedby="profile-error"
                name="email"
                type="email"
                required
                defaultValue={profileQuery.data.email}
              />
            </label>
            <label>
              <span className="account-field-label">Nome ENS</span>
              <EnsField defaultValue={profileQuery.data.ens ?? ''} errorId="profile-error" />
            </label>
            <label>
              <span className="account-field-label">Apelido da carteira</span>
              <input
                aria-describedby="profile-error"
                name="walletNickname"
                required
                defaultValue={profileQuery.data.walletNickname ?? ''}
              />
            </label>
            <div className="profile-avatar">
              {avatar ? (
                <img className="avatar" src={avatar} alt="Seu avatar" width="48" height="48" />
              ) : (
                <span className="avatar-placeholder" aria-hidden="true">
                  <span className="asset-icon image-icon" />
                </span>
              )}
              <label>
                Avatar
                <input
                  type="file"
                  id="profile-avatar"
                  hidden
                  aria-describedby="profile-error"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    if (
                      file.size > 500_000 ||
                      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
                    ) {
                      setFileError('Use PNG, JPEG ou WebP de até 500 KB.')
                      return
                    }
                    setFileError('')
                    const reader = new FileReader()
                    reader.onload = () => setAvatar(String(reader.result))
                    reader.readAsDataURL(file)
                  }}
                />
              </label>
              <div className="avatar-actions">
                <Button
                  type="button"
                  onClick={() => document.getElementById('profile-avatar')?.click()}
                >
                  Alterar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="account-text-button"
                  onClick={() => setAvatar('')}
                >
                  Remover
                </Button>
              </div>
            </div>
            <p id="profile-error" role="alert">
              {fileError || (saveProfile.isError ? getErrorMessage(saveProfile.error) : '')}
            </p>
            {saveProfile.isSuccess && (
              <SuccessMessage key={saveProfile.submittedAt} message="Perfil salvo." />
            )}
          </form>
          <div className="profile-password">
            <h2>Alterar senha</h2>
            <PasswordField
              form="profile-form"
              name="current"
              label="Senha atual"
              autoComplete="current-password"
              aria-describedby="password-error"
            />
            <PasswordField
              form="profile-form"
              name="password"
              label="Nova senha"
              autoComplete="new-password"
              aria-describedby="password-error"
              minLength={8}
            />
            <PasswordField
              form="profile-form"
              name="confirm"
              label="Confirmar nova senha"
              autoComplete="new-password"
              aria-describedby="password-error"
              minLength={8}
            />
            <Button
              form="profile-form"
              disabled={saveProfile.isPending || changePassword.isPending || Boolean(fileError)}
            >
              Salvar
            </Button>
            <p id="password-error" role="alert">
              {changePassword.isError ? getErrorMessage(changePassword.error) : ''}
            </p>
            {changePassword.isSuccess && (
              <SuccessMessage key={changePassword.submittedAt} message="Senha alterada." />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
export function ProfilePage() {
  return (
    <Private>
      <Profile />
    </Private>
  )
}
