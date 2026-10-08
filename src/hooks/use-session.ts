import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { User } from '../contracts'

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async ({ signal }) => (await api.get<User | null>('/session', { signal })).data,
    staleTime: 0,
    refetchInterval: 30_000,
  })
}

export function useLogout() {
  const client = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => api.post('/logout'),
    onSuccess: async () => {
      await client.cancelQueries()
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
      client.setQueryData(['session'], null)
      await client.invalidateQueries({ queryKey: ['session'] })
      sessionStorage.removeItem('kurio.attempt')
      await navigate({
        to: '/',
        search: { q: '', category: '', network: '', sort: 'recent', page: 1 },
      })
    },
  })
}
