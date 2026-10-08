import { useState } from 'react'
import { LoginModal } from './login-modal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '../lib/api'
import { useSession } from '../hooks/use-session'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export function Favorite({ id, iconOnly = false }: { id: string; iconOnly?: boolean }) {
  const [loginOpen, setLoginOpen] = useState(false)
  const sessionQuery = useSession()
  const queryClient = useQueryClient()
  const favoritesKey = ['favorites', sessionQuery.data?.id]
  const favoritesQuery = useQuery({
    queryKey: favoritesKey,
    enabled: Boolean(sessionQuery.data),
    queryFn: async ({ signal }) => (await api.get<string[]>('/favorites', { signal })).data,
  })
  const toggleFavorite = useMutation({
    mutationFn: () => api.put<string[]>(`/favorites/${id}`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: favoritesKey })
      const previous = queryClient.getQueryData<string[]>(favoritesKey) ?? []
      // Mostra a mudança imediatamente; onError restaura esta cópia se a API recusar.
      queryClient.setQueryData(
        favoritesKey,
        previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
      )
      return previous
    },
    onError: (_error, _variables, previous) => queryClient.setQueryData(favoritesKey, previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoritesKey }),
  })
  return (
    <div>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              disabled={toggleFavorite.isPending}
              aria-disabled={toggleFavorite.isPending}
              aria-pressed={favoritesQuery.data?.includes(id) ?? false}
              onClick={() => {
                if (sessionQuery.data) toggleFavorite.mutate()
                else setLoginOpen(true)
              }}
            >
              <span
                className={`asset-icon ${favoritesQuery.data?.includes(id) ? 'heart-filled-icon' : 'heart-icon'}`}
                aria-hidden="true"
              />
              <span className={iconOnly ? 'sr-only' : undefined}>
                {favoritesQuery.data?.includes(id) ? 'Favoritado' : 'Favoritar'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!sessionQuery.data
              ? 'Entre para favoritar.'
              : favoritesQuery.data?.includes(id)
                ? 'Remover dos favoritos'
                : 'Adicionar aos favoritos'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <p role="alert">{toggleFavorite.isError ? getErrorMessage(toggleFavorite.error) : ''}</p>
    </div>
  )
}
