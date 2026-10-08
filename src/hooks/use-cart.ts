import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '../lib/api'
import { useSession } from './use-session'
import type { CartItem } from '../contracts'

export function useCart() {
  const session = useSession()
  return useQuery({
    queryKey: ['cart', session.data?.id ?? 'guest'],
    queryFn: async ({ signal }) => {
      const response = await api.get<CartItem[]>('/cart', { signal })
      if (!Array.isArray(response.data)) {
        throw new AxiosError('Carrinho inválido.', 'INVALID_RESPONSE', response.config, undefined, {
          ...response,
          data: { message: 'Falha ao atualizar o carrinho. Tente novamente.' },
        })
      }
      return response.data
    },
  })
}
