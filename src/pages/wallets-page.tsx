import { SuccessMessage } from '../components/success-message'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter, useNavigate, useSearch } from '@tanstack/react-router'
import { api, getErrorMessage } from '../lib/api'
import { Private } from '../account'
import { useSession } from '../hooks/use-session'
import { Button } from '../components/ui/button'
import { AccountMenu } from '../components/account-menu'
import { EnsField } from '../components/ens-field'
import type { Wallet } from '../contracts'

function Wallets() {
  const { from } = useSearch({ from: '/wallets' })
  const router = useRouter()
  const navigate = useNavigate()
  const sessionQuery = useSession()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Wallet | null | undefined>()
  const walletsKey = ['wallets', sessionQuery.data?.id]
  const walletsQuery = useQuery({
    queryKey: walletsKey,
    queryFn: async ({ signal }) => (await api.get<Wallet[]>('/wallets', { signal })).data,
  })
  const saveWallet = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put<Wallet[]>('/wallets', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletsKey })
      setEditing(undefined)
    },
  })
  const primaryWallet = walletsQuery.data?.find((wallet) => wallet.primary)
  const secondaryWallet = walletsQuery.data?.find((wallet) => !wallet.primary)
  const selectedWallet = editing === undefined ? primaryWallet : editing
  return (
    <section
      className={`account-layout wallets-page${from === 'checkout' ? ' wallets-checkout' : ''}`}
    >
      <div className="mobile-page-heading">
        <Button
          variant="outline"
          aria-label="Voltar"
          onClick={() => {
            if (router.history.canGoBack()) router.history.back()
            else
              void navigate({ to: from === 'checkout' ? '/checkout' : '/profile', replace: true })
          }}
        >
          <span className="asset-icon pagination-chevron" aria-hidden="true" />
        </Button>
        <h1>Carteiras</h1>
      </div>
      {from !== 'checkout' && <AccountMenu />}
      <div>
        <div className="wallet-heading">
          <h1>
            {selectedWallet?.primary || !primaryWallet
              ? 'Carteira principal'
              : 'Carteira secundária'}
          </h1>
          <Button
            variant="outline"
            className="account-text-button"
            disabled={saveWallet.isPending || (walletsQuery.data?.length ?? 0) >= 2}
            onClick={() => setEditing(null)}
          >
            Adicionar
          </Button>
        </div>
        <p className="text-copy text-[14px]">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
        {walletsQuery.isPending ? (
          <p>Carregando…</p>
        ) : walletsQuery.isError ? (
          <p role="alert">{getErrorMessage(walletsQuery.error)}</p>
        ) : null}
        <form
          className="wallet-fields"
          key={selectedWallet?.id ?? 'new'}
          onSubmit={(event) => {
            event.preventDefault()
            const data = Object.fromEntries(new FormData(event.currentTarget))
            saveWallet.mutate({ ...data, id: selectedWallet?.id, primary: data.primary === 'on' })
          }}
        >
          <label>
            <span className="account-field-label">Nome de exibição</span>
            <input
              aria-describedby="wallet-error"
              name="name"
              required
              defaultValue={selectedWallet?.name ?? sessionQuery.data?.name}
            />
          </label>
          <label>
            <span className="account-field-label">Apelido da carteira</span>
            <input
              aria-describedby="wallet-error"
              name="nickname"
              required
              defaultValue={selectedWallet?.nickname ?? ''}
            />
          </label>
          <label>
            <span className="account-field-label">Rede</span>
            <select
              aria-describedby="wallet-error"
              name="network"
              required
              defaultValue={selectedWallet?.network ?? ''}
            >
              <option value="" disabled>
                Selecione uma rede
              </option>
              <option>Ethereum</option>
              <option>Polygon</option>
              <option>Solana</option>
            </select>
          </label>
          <label>
            <span className="account-field-label">Nome do perfil</span>
            <input
              name="profileName"
              required
              maxLength={100}
              aria-describedby="wallet-error"
              defaultValue={selectedWallet?.profileName ?? sessionQuery.data?.username}
            />
          </label>
          <label>
            <span className="account-field-label">Endereço da carteira</span>
            <input
              name="address"
              placeholder="Endereço 0x da carteira"
              aria-describedby="wallet-error"
              required
              defaultValue={selectedWallet?.address ?? ''}
            />
          </label>
          <label>
            <span className="sr-only">ENS ou carteira secundária (opcional)</span>
            <input
              name="secondaryAddress"
              maxLength={100}
              aria-describedby="wallet-error"
              placeholder="ENS ou carteira secundária (opcional)"
              defaultValue={selectedWallet?.secondaryAddress ?? ''}
            />
          </label>
          <label>
            <span className="account-field-label">Tipo de carteira</span>
            <select
              aria-describedby="wallet-error"
              name="provider"
              required
              defaultValue={selectedWallet?.provider ?? ''}
            >
              <option value="" disabled>
                Selecione uma carteira
              </option>
              <option>MetaMask</option>
              <option>Coinbase Wallet</option>
              <option>WalletConnect</option>
            </select>
          </label>
          <label>
            <span className="account-field-label">Código de indicação</span>
            <input
              name="referral"
              required
              maxLength={30}
              aria-describedby="wallet-error"
              defaultValue={selectedWallet?.referral ?? ''}
            />
          </label>
          <label>
            <span className="account-field-label">E-mail</span>
            <input
              aria-describedby="wallet-error"
              name="email"
              type="email"
              required
              defaultValue={selectedWallet?.email ?? sessionQuery.data?.email}
            />
          </label>
          <label>
            <span className="account-field-label">Nome ENS</span>
            <EnsField
              defaultValue={selectedWallet?.ens ?? sessionQuery.data?.ens ?? ''}
              errorId="wallet-error"
            />
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              name="primary"
              defaultChecked={selectedWallet?.primary ?? !primaryWallet}
            />
            Carteira principal
          </label>
          <Button disabled={saveWallet.isPending}>Salvar carteira</Button>
          {editing !== undefined && (
            <Button type="button" variant="outline" onClick={() => setEditing(undefined)}>
              Cancelar edição
            </Button>
          )}
          <p id="wallet-error" role="alert">
            {saveWallet.isError ? getErrorMessage(saveWallet.error) : ''}
          </p>
          {saveWallet.isSuccess && (
            <SuccessMessage key={saveWallet.submittedAt} message="Carteira salva." />
          )}
        </form>
        <section className="secondary-wallet">
          <div className="wallet-heading">
            <h2>Carteira secundária</h2>
            {!secondaryWallet && (
              <Button
                variant="outline"
                className="account-text-button"
                disabled={saveWallet.isPending || !primaryWallet}
                onClick={() => setEditing(null)}
              >
                Adicionar
              </Button>
            )}
          </div>
          {!secondaryWallet && (
            <p className="text-copy text-[14px]">
              Você ainda não adicionou uma carteira secundária.
            </p>
          )}
          {walletsQuery.data
            ?.filter((wallet) => !wallet.primary)
            .map((wallet) => (
              <article key={wallet.id} className="wallet-item">
                <div>
                  <h3>
                    {wallet.primary ? 'Carteira principal' : 'Carteira secundária'} ·{' '}
                    {wallet.nickname}
                  </h3>
                  <p className="text-copy text-[14px]">
                    {wallet.provider} · {wallet.network} · {wallet.address}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="account-text-button"
                  onClick={() => setEditing(wallet)}
                >
                  Editar carteira
                </Button>
              </article>
            ))}
        </section>
      </div>
    </section>
  )
}
export function WalletsPage() {
  return (
    <Private>
      <Wallets />
    </Private>
  )
}
