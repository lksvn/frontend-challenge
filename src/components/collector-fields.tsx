import type { User, Wallet } from '../contracts'
import { EnsField } from './ens-field'

interface CollectorFieldsProps {
  user: User | null | undefined
  wallets: Wallet[] | undefined
  selectedWallet: Wallet | undefined
  onWalletChange: (id: string) => void
}

export function CollectorFields({
  user,
  wallets,
  selectedWallet,
  onWalletChange,
}: CollectorFieldsProps) {
  const walletId = selectedWallet?.id ?? ''
  return (
    <div className="collector-fields">
      <h2>Perfil do colecionador</h2>
      <label>
        Nome de exibição
        <input aria-describedby="checkout-error" name="name" required defaultValue={user?.name} />
      </label>
      <label>
        Nome de usuário
        <input
          aria-describedby="checkout-error"
          name="username"
          required
          pattern="[a-zA-Z0-9_]{3,30}"
          defaultValue={user?.username}
        />
      </label>
      <label>
        Rede
        <select
          name="network"
          value={selectedWallet?.network ?? ''}
          required
          aria-describedby="checkout-error"
          onChange={(event) => {
            onWalletChange(
              wallets?.find((wallet) => wallet.network === event.target.value)?.id ?? '',
            )
          }}
        >
          <option value="">Selecione uma rede</option>
          {[...new Set(wallets?.map((wallet) => wallet.network))].map((network) => (
            <option key={network}>{network}</option>
          ))}
        </select>
      </label>
      <label>
        Nome do perfil
        <input
          key={walletId}
          name="profileName"
          required
          maxLength={100}
          aria-describedby="checkout-error"
          defaultValue={selectedWallet?.profileName ?? user?.username}
        />
      </label>
      <label>
        Endereço da carteira
        <input
          name="address"
          value={selectedWallet?.address ?? ''}
          required
          readOnly
          aria-describedby="checkout-error"
          placeholder="Endereço 0x da carteira"
        />
      </label>
      <label>
        ENS ou carteira secundária (opcional)
        <input
          key={walletId}
          name="secondaryAddress"
          maxLength={100}
          defaultValue={selectedWallet?.secondaryAddress ?? ''}
          aria-describedby="checkout-error"
          placeholder="ENS ou carteira secundária (opcional)"
        />
      </label>
      <label>
        Tipo de carteira
        <select
          name="provider"
          value={selectedWallet?.provider ?? ''}
          required
          aria-describedby="checkout-error"
          onChange={(event) => {
            onWalletChange(
              wallets?.find(
                (wallet) =>
                  wallet.provider === event.target.value &&
                  wallet.network === selectedWallet?.network,
              )?.id ?? '',
            )
          }}
        >
          <option value="">Selecione uma carteira</option>
          {[
            ...new Set(
              wallets
                ?.filter((wallet) => wallet.network === selectedWallet?.network)
                .map((wallet) => wallet.provider),
            ),
          ].map((provider) => (
            <option key={provider}>{provider}</option>
          ))}
        </select>
      </label>
      <label>
        Código de indicação
        <input
          key={walletId}
          aria-describedby="checkout-error"
          name="referral"
          required
          maxLength={30}
          defaultValue={selectedWallet?.referral ?? ''}
        />
      </label>
      <label>
        E-mail
        <input
          aria-describedby="checkout-error"
          name="email"
          required
          type="email"
          defaultValue={user?.email}
        />
      </label>

      <label>
        Nome ENS
        <EnsField defaultValue={user?.ens ?? ''} errorId="checkout-error" />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={Boolean(selectedWallet && !selectedWallet.primary)}
          disabled={!wallets?.some((wallet) => !wallet.primary)}
          onChange={(event) => {
            onWalletChange(
              wallets?.find((wallet) => wallet.primary !== event.target.checked)?.id ?? '',
            )
          }}
        />
        Usar outra carteira?
      </label>

      <label>
        Observação do colecionador (opcional)
        <textarea aria-describedby="checkout-error" name="notes" maxLength={1000} />
      </label>
    </div>
  )
}
