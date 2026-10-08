import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Private } from '../account'
import { AccountMenu } from '../components/account-menu'
import { Favorite } from '../components/favorite'
import { NftPrice } from '../components/nft-price'
import { Button } from '../components/ui/button'
import type { Nft } from '../contracts'
import { useSession } from '../hooks/use-session'
import { api, getErrorMessage } from '../lib/api'

function Favorites() {
  const session = useSession()
  const router = useRouter()
  const navigate = useNavigate()
  const favorites = useQuery({
    queryKey: ['favorites', session.data?.id],
    queryFn: async ({ signal }) => (await api.get<string[]>('/favorites', { signal })).data,
  })
  const nfts = useQueries({
    queries: (favorites.data ?? []).map((id) => ({
      queryKey: ['nft', id],
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (await api.get<Nft>(`/nfts/${id}`, { signal })).data,
    })),
  })
  return (
    <section className="account-layout favorites-page">
      <div className="mobile-page-heading">
        <Button
          variant="outline"
          aria-label="Voltar"
          onClick={() => {
            if (router.history.canGoBack()) router.history.back()
            else
              void navigate({
                to: '/',
                search: { q: '', category: '', network: '', sort: 'recent', page: 1 },
                replace: true,
              })
          }}
        >
          <span className="asset-icon pagination-chevron" aria-hidden="true" />
        </Button>
        <h1>Favoritos</h1>
      </div>
      <AccountMenu />
      <div>
        <h1 className="favorites-heading">Favoritos</h1>
        {favorites.isPending && <p role="status">Carregando favoritos…</p>}
        {favorites.isError && (
          <div role="alert">
            <p>{getErrorMessage(favorites.error)}</p>
            <Button onClick={() => void favorites.refetch()} disabled={favorites.isFetching}>
              Tentar novamente
            </Button>
          </div>
        )}
        {favorites.data?.length === 0 && (
          <p className="favorites-empty" role="status">
            Você ainda não favoritou nenhum NFT.
          </p>
        )}
        <div className="favorites-list">
          {nfts.map((query, index) => {
            const nft = query.data
            if (query.isPending)
              return (
                <article
                  className="favorite-row favorite-row-skeleton"
                  key={favorites.data![index]}
                  aria-label="Carregando NFT"
                  aria-busy="true"
                >
                  <div className="skeleton favorite-image" aria-hidden="true" />
                  <div className="favorite-info" aria-hidden="true">
                    <h2 className="skeleton">Carregando NFT</h2>
                    <p className="favorite-token skeleton">ID do token</p>
                    <p className="price skeleton">0.00 ETH</p>
                  </div>
                </article>
              )
            if (!nft)
              return (
                <div key={favorites.data![index]} role="alert">
                  <p>{getErrorMessage(query.error)}</p>
                  <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
                    Tentar novamente
                  </Button>
                </div>
              )
            return (
              <article className="favorite-row" key={nft.id}>
                <Link to="/nfts/$id" params={{ id: nft.id }}>
                  <img src={nft.image} alt={nft.name} width="70" height="70" />
                </Link>
                <div className="favorite-info">
                  <h2>
                    <Link to="/nfts/$id" params={{ id: nft.id }}>
                      {nft.name}
                    </Link>
                  </h2>
                  <p className="favorite-token">ID do token: {nft.tokenId}</p>
                  <NftPrice nft={nft} />
                </div>
                <Favorite id={nft.id} iconOnly />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FavoritesPage() {
  return (
    <Private>
      <Favorites />
    </Private>
  )
}
