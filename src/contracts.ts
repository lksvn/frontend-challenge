export interface Nft {
  id: string
  name: string
  image: string
  images: string[]
  description: string
  tokenId: string
  attributes: string[]
  details: {
    paragraphs: string[]
    network: string
    contract: string
    royalties: string
  }
  collection: string
  category: string
  network: string
  price: string
  originalPrice?: string
  available: number
  version: number
  featured: boolean
  rarity: string | null
  rating: { score: number; count: number }
  editions: { id: string; name: string; enabled: boolean }[]
}

export interface CatalogSearch {
  view?: 'all' | 'new' | 'trending'
  q: string
  category: string
  network: string
  sort: 'recent' | 'price-asc' | 'price-desc'
  page: number
  min?: string
  max?: string
}

export interface Catalog {
  items: Nft[]
  total: number
  pages: number
  filters: {
    categories: { name: string; count: number }[]
    networks: { name: string; count: number }[]
  }
}

export interface NftUpdated {
  eventId: string
  nft: Nft
}

export interface ApiError {
  code: string
  message: string
  fields?: Record<string, string>
}

export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar: string
  ens?: string
  walletNickname?: string
}

export interface Wallet {
  id: string
  address: string
  network: string
  provider: string
  primary: boolean
  name?: string
  nickname?: string
  email?: string
  ens?: string
  profileName?: string
  referral?: string
  secondaryAddress?: string
}

export interface WalletConnection {
  connected: boolean
  message: string
}

export interface CartItem {
  nft: Nft
  quantity: number
  edition: string
  lineSubtotal?: string
}

export interface Quote {
  id: string
  userId: string
  items: CartItem[]
  subtotal: string
  discount: string
  fee: string
  total: string
  coupon: string
  expiresAt: number
}

export interface Order {
  id: string
  userId: string
  status: 'pending' | 'confirmed' | 'declined'
  quote: Quote
  transaction: string
  createdAt?: string
  wallet?: Pick<Wallet, 'provider' | 'network' | 'address'>
  version: number
  collector: Record<string, string>
}

export interface OrderUpdated {
  eventId: string
  userId: string
  order: Order
}

export interface DemoState {
  scenario: string
  scenarios: { id: string; label: string; description: string }[]
  nfts: { id: string; name: string }[]
}
