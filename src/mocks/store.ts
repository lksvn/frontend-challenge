import type { CartItem, Nft, Order, Quote, User, Wallet } from '../contracts'
import { createNfts, promotionalPrice } from './fixtures'
import { fromWei, toWei } from '../lib/money'

interface Account extends User {
  salt: string
  passwordHash: string
}

interface State {
  version: number
  nfts: Nft[]
  accounts: Account[]
  session: { userId: string; expiresAt: number } | null
  carts: Record<string, CartItem[]>
  favorites: Record<string, string[]>
  wallets: Record<string, Wallet[]>
  orders: Record<string, Order>
  attempts: Record<string, { payload: string; orderId: string }>
  quotes: Record<string, Quote>
  scenario: string
  payments?: Record<string, 'confirmed' | 'declined'>
}

const KEY = 'kurio.mock.v1'

const anaWallet: Wallet = {
  id: 'ana-primary',
  name: 'Ana',
  nickname: 'Principal',
  address: '0x1111111111111111111111111111111111111111',
  network: 'Ethereum',
  provider: 'MetaMask',
  primary: true,
  email: 'ana@kurio.test',
  ens: 'ana.eth',
  profileName: 'ana',
  referral: 'KURIO',
}

export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function initialState(): Promise<State> {
  const accounts = await Promise.all(
    ['ana', 'leo'].map(async (name, index) => {
      const salt = crypto.randomUUID()
      return {
        id: String(index + 1),
        name,
        username: name,
        email: `${name}@kurio.test`,
        avatar: '',
        salt,
        passwordHash: await hashPassword('Kurio123!', salt),
      }
    }),
  )
  return {
    version: 7,
    nfts: createNfts(),
    accounts,
    session: null,
    carts: { guest: [] },
    favorites: {},
    wallets: { '1': [structuredClone(anaWallet)] },
    orders: {},
    attempts: {},
    quotes: {},
    scenario: 'success',
    payments: {},
  }
}

let state: State
export const ready = (async () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as State | null
    if (saved && [1, 2].includes(saved.version)) {
      const fixtures = createNfts()
      saved.nfts = saved.nfts.map((nft) => ({
        ...fixtures.find((item) => item.id === nft.id),
        ...nft,
        editions: fixtures.find((item) => item.id === nft.id)!.editions,
      }))
      saved.version = 3
    }
    if (saved?.version === 3) {
      const fixtures = createNfts()
      saved.nfts = saved.nfts.map((nft) => ({
        ...nft,
        rarity: fixtures.find((item) => item.id === nft.id)?.rarity ?? null,
      }))
      saved.version = 4
    }
    if (saved?.version === 4) {
      saved.nfts = saved.nfts.map((nft, index) =>
        index % 3 === 0
          ? {
              ...nft,
              originalPrice: nft.price,
              price: promotionalPrice(nft.price),
              version: nft.version + 1,
            }
          : nft,
      )
      saved.version = 5
    }
    if (saved?.version === 5) {
      const fixtures = createNfts()
      saved.nfts = saved.nfts.map((nft) => {
        const fixture = fixtures.find((item) => item.id === nft.id)!
        return {
          ...nft,
          tokenId: fixture.tokenId,
          attributes: fixture.attributes,
          details: {
            ...fixture.details,
            paragraphs: fixture.details.paragraphs.map((paragraph) =>
              paragraph
                .replace(fixture.network, nft.network)
                .replace(
                  fixture.editions.find((edition) => edition.enabled)!.name,
                  nft.editions.find((edition) => edition.enabled)!.name,
                ),
            ),
            network: `Cunhado na ${nft.network} com procedência imutável e metadados armazenados no IPFS.`,
          },
        }
      })
      saved.version = 6
    }
    if (saved?.version === 6) {
      const ana = saved.accounts.find((account) => account.email === 'ana@kurio.test')
      if (ana && !saved.wallets[ana.id]?.length) {
        saved.wallets[ana.id] = [structuredClone(anaWallet)]
      }
      saved.version = 7
    }
    state = saved?.version === 7 ? saved : await initialState()
  } catch {
    state = await initialState()
  }
  save()
})()

export function store() {
  return state
}
export function save() {
  localStorage.setItem(KEY, JSON.stringify(state))
}
export async function reset(scenario = 'success') {
  state = await initialState()
  state.scenario = scenario
  save()
}
export function user(): Account | undefined {
  return state.session && state.session.expiresAt > Date.now()
    ? state.accounts.find((account) => account.id === state.session!.userId)
    : undefined
}
export function publicUser(account: Account): User {
  const {
    id,
    name,
    username,
    email,
    avatar,
    ens = 'colecionador.eth',
    walletNickname = 'Minha carteira',
  } = account
  return { id, name, username, email, avatar, ens, walletNickname }
}
export function cartKey() {
  return user()?.id ?? 'guest'
}
export function cart(): CartItem[] {
  const key = cartKey()
  state.carts[key] ??= []
  return state.carts[key].map((item) => ({
    ...item,
    nft: state.nfts.find((nft) => nft.id === item.nft.id)!,
  }))
}
export function quote(coupon = ''): Quote {
  const items = cart()
  if (items.some((item) => item.quantity > item.nft.available))
    throw new Error('Uma edição não tem estoque suficiente. Remova o item do carrinho.')
  if (
    items.some((item) => !item.nft.editions.find((edition) => edition.id === item.edition)?.enabled)
  )
    throw new Error('Uma edição está indisponível. Remova o item do carrinho.')
  if (coupon && coupon !== 'KURIO10')
    throw new Error(coupon === 'EXPIRED' ? 'Cupom expirado.' : 'Cupom inválido.')
  const subtotal = items.reduce(
    (total, item) => total + toWei(item.nft.price) * BigInt(item.quantity),
    0n,
  )
  const discount = coupon ? subtotal / 10n : 0n
  const fee = items.length ? toWei('0.016') : 0n
  return {
    id: crypto.randomUUID(),
    userId: cartKey(),
    items: structuredClone(items),
    subtotal: fromWei(subtotal),
    discount: fromWei(discount),
    fee: fromWei(fee),
    total: fromWei(subtotal - discount + fee),
    coupon,
    expiresAt: Date.now() + 60_000,
  }
}
