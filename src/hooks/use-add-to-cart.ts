import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useCart } from './use-cart'
import type { Nft } from '../contracts'

export function useAddToCart(nft: Nft, edition: string, quantity: number) {
  const client = useQueryClient()
  const cart = useCart()
  const existing =
    cart.data?.find((item) => item.nft.id === nft.id && item.edition === edition)?.quantity ?? 0
  const remaining = Math.max(0, nft.available - existing)
  const mutation = useMutation({
    mutationFn: () => api.put(`/cart/${nft.id}`, { quantity: existing + quantity, edition }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['cart'] }),
  })
  const disabled =
    cart.isPending ||
    cart.isError ||
    mutation.isPending ||
    quantity < 1 ||
    !Number.isInteger(quantity) ||
    quantity > remaining ||
    !nft.editions.find((item) => item.id === edition)?.enabled
  return { mutation, remaining, disabled }
}
