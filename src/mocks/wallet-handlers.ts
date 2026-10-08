import { http, HttpResponse } from 'msw'
import { store, user, save } from './store'
import {
  body,
  error,
  unauthorized,
  emailValid,
  textValid,
  secondaryAddressValid,
} from './validation'
import type { Wallet } from '../contracts'

export const walletHandlers = [
  http.get('/api/wallets', () =>
    user() ? HttpResponse.json(store().wallets[user()!.id] ?? []) : unauthorized(),
  ),
  http.put('/api/wallets', async ({ request }) => {
    if (!user()) return unauthorized()
    const data = await body(request)
    const network = String(data.network)
    const address = String(data.address)
    const fields: Record<string, string> = {}
    if (!textValid(data.name)) fields.name = 'Informe um nome de exibição de até 100 caracteres.'
    if (!textValid(data.nickname)) fields.nickname = 'Informe um apelido de até 100 caracteres.'
    if (!textValid(data.profileName))
      fields.profileName = 'Informe um nome do perfil de até 100 caracteres.'
    if (!textValid(data.referral) || String(data.referral).length > 30)
      fields.referral = 'Informe um código de indicação de até 30 caracteres.'
    if (!secondaryAddressValid(data.secondaryAddress, network))
      fields.secondaryAddress = 'Informe um ENS .eth ou endereço válido para a rede selecionada.'
    if (!emailValid(data.email)) fields.email = 'Informe um e-mail válido.'
    if (typeof data.ens !== 'string' || !/^\S+\.eth$/.test(data.ens))
      fields.ens = 'Nome ENS deve terminar em .eth e não conter espaços.'
    if (
      !['Ethereum', 'Polygon', 'Solana'].includes(network) ||
      !(network === 'Solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ : /^0x[a-fA-F0-9]{40}$/).test(
        address,
      )
    )
      fields.address = 'Endereço ou rede inválidos.'
    const wallets = store().wallets[user()!.id] ?? []
    if (!['MetaMask', 'Coinbase Wallet', 'WalletConnect'].includes(String(data.provider)))
      fields.provider = 'Tipo de carteira inválido.'
    if (Object.keys(fields).length)
      return error(Object.values(fields).join(' '), 422, 'VALIDATION', fields)
    if (data.id && !wallets.some((item) => item.id === data.id))
      return error('Carteira não encontrada.', 404, 'NOT_FOUND')
    if (
      wallets.some(
        (item) =>
          item.id !== data.id &&
          item.network === network &&
          item.address.toLowerCase() === address.toLowerCase(),
      )
    )
      return error('Carteira já cadastrada.', 409, 'CONFLICT')
    if (!data.id && wallets.length >= 2)
      return error('Edite uma das duas carteiras cadastradas.', 409)
    const id = String(data.id || crypto.randomUUID())
    const wallet: Wallet = {
      id,
      address,
      network,
      provider: String(data.provider ?? 'MetaMask'),
      primary: Boolean(data.primary) || wallets.length === 0,
      name: String(data.name ?? user()!.name),
      nickname: String(data.nickname ?? 'Minha carteira'),
      email: String(data.email ?? user()!.email),
      ens: String(data.ens ?? 'colecionador.eth'),
      profileName: String(data.profileName),
      referral: String(data.referral),
      secondaryAddress: String(data.secondaryAddress),
    }
    const items = wallets.filter((item) => item.id !== id)
    if (wallet.primary)
      items.forEach((item) => {
        item.primary = false
      })
    items.push(wallet)
    if (!items.some((item) => item.primary)) items[0].primary = true
    store().wallets[user()!.id] = items
    save()
    return HttpResponse.json(items)
  }),
  http.post('/api/wallets/:id/connection', async ({ request, params }) => {
    const account = user()
    if (!account) return unauthorized()
    if (!(store().wallets[account.id] ?? []).some((wallet) => wallet.id === params.id))
      return error('Carteira não encontrada.', 404, 'NOT_FOUND')
    const { action, provider } = await body(request)
    if (
      provider !== undefined &&
      !['WalletConnect', 'MetaMask', 'Coinbase Wallet'].includes(String(provider))
    )
      return error('Método de conexão inválido.')
    if (!['connect', 'decline', 'disconnect'].includes(String(action)))
      return error('Ação de conexão inválida.')
    return HttpResponse.json({
      connected: action === 'connect',
      message:
        action === 'connect'
          ? 'Carteira conectada na simulação.'
          : action === 'decline'
            ? 'Conexão recusada pelo usuário.'
            : 'Carteira desconectada.',
    })
  }),
]
