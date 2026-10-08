import { useQuery } from '@tanstack/react-query'
import { NftCarousel } from './nft-carousel'
import type { Nft } from '../contracts'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/api'
import { Button } from './ui/button'

export function CartRecommendations() {
  const query = useQuery({
    queryKey: ['nfts', 'recommendations'],
    queryFn: async ({ signal }) => (await api.get<Nft[]>('/nfts/recommendations', { signal })).data,
  })
  return (
    <section className="cart-recommendations" aria-labelledby="recommendations-title">
      <h2 id="recommendations-title">Colecionadores também viram</h2>
      {query.isPending ? (
        <div
          className="recommendations-page"
          aria-label="Carregando recomendações"
          aria-busy="true"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div className="skeleton" key={index} />
          ))}
        </div>
      ) : query.isError ? (
        <div>
          <p role="alert">{getErrorMessage(query.error)}</p>
          <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        </div>
      ) : !query.data.length ? (
        <p>Nenhum NFT disponível.</p>
      ) : (
        <NftCarousel items={query.data} />
      )}
    </section>
  )
}
