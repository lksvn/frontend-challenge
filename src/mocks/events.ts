import type { NftUpdated, OrderUpdated } from '../contracts'

export const orderListeners = new Set<(event: OrderUpdated) => void>()
export const nftListeners = new Set<(event: NftUpdated) => void>()
