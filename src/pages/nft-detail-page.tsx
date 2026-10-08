import { NftDetailSkeleton } from '../components/nft-detail-skeleton'
import { NftPrice } from '../components/nft-price'
import { useEffect, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Tabs } from 'radix-ui'
import { api } from '../lib/api'
import type { Catalog, Nft } from '../contracts'
import { Button } from '../components/ui/button'
import { NftCarousel } from '../components/nft-carousel'
import { AddToCart } from '../components/cart-items'
import { NftGallery } from '../components/nft-gallery'

export function NftDetailPage({ id }: { id: string }) {
  const router = useRouter()
  const [shareMessage, setShareMessage] = useState('')
  useEffect(() => {
    setShareMessage('')
  }, [id])
  const nftQuery = useQuery({
    queryKey: ['nft', id],
    queryFn: async ({ signal }) => (await api.get<Nft>(`/nfts/${id}`, { signal })).data,
    retry: false,
  })
  const relatedQuery = useQuery({
    queryKey: ['nfts', 'related', nftQuery.data?.category],
    enabled: Boolean(nftQuery.data),
    queryFn: async ({ signal }) =>
      (await api.get<Catalog>('/nfts', { params: { category: nftQuery.data?.category }, signal }))
        .data,
  })
  if (nftQuery.isPending) return <NftDetailSkeleton />
  if (!nftQuery.data)
    return (
      <section>
        <h1>NFT indisponível</h1>
        <p>O item não existe ou não pôde ser carregado.</p>
        <Button onClick={() => void nftQuery.refetch()}>Tentar novamente</Button>{' '}
        <Link to="/" search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}>
          Voltar ao catálogo
        </Link>
      </section>
    )
  const nft = nftQuery.data
  const shareNft = async () => {
    setShareMessage('')
    const url = new URL(`${import.meta.env.BASE_URL}nfts/${nft.id}`, window.location.origin).href
    try {
      if (navigator.share) {
        await navigator.share({ title: nft.name, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareMessage('Link copiado.')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareMessage('Não foi possível compartilhar. Tente novamente.')
    }
  }
  return (
    <>
      {nftQuery.isError && (
        <div role="alert">
          Não foi possível atualizar este NFT. Exibindo os últimos dados recebidos.
          <Button onClick={() => void nftQuery.refetch()}>Tentar novamente</Button>
        </div>
      )}
      <nav aria-label="Navegação estrutural" className="breadcrumb">
        <Link to="/" search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}>
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          to="/"
          hash="catalogo"
          search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
        >
          Mercado
        </Link>
      </nav>
      <section className="detail-layout nft-detail-layout">
        <button
          type="button"
          className="mobile-detail-back"
          aria-label="Voltar ao catálogo"
          onClick={() => {
            if (router.history.canGoBack()) router.history.back()
            else
              void router.navigate({
                to: '/',
                search: { q: '', category: '', network: '', sort: 'recent', page: 1 },
              })
          }}
        >
          <span className="asset-icon pagination-chevron" aria-hidden="true" />
        </button>
        <NftGallery key={nft.id} nft={nft} />
        <div className="detail-information">
          <h1>{nft.name}</h1>
          <div className="detail-price-rating">
            <NftPrice nft={nft} />
            <div className="nft-rating">
              <span
                className="rating-stars"
                role="img"
                aria-label={`Avaliação: ${nft.rating.score} de 5 estrelas`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <span
                    className={`asset-icon star-icon ${index < Math.floor(nft.rating.score) ? 'text-primary' : 'text-copy'}`}
                    key={index}
                    aria-hidden="true"
                  />
                ))}
              </span>
              <span>{nft.rating.count} avaliações de colecionadores</span>
            </div>
          </div>
          <h2 className="detail-about-title">Sobre este NFT:</h2>
          <p className="detail-description text-copy text-[14px]">{nft.description}</p>
          <AddToCart key={nft.id} nft={nft} />
          <p className="detail-metadata text-copy text-[14px]">
            ID do token: #{nft.tokenId}
            <br />
            Coleção: {nft.collection}
            <br />
            Atributos: {[...nft.attributes, ...(nft.rarity ? [nft.rarity] : [])].join(', ')}
          </p>
          <div className="nft-share">
            <button type="button" onClick={() => void shareNft()}>
              <span className="asset-icon send-icon" aria-hidden="true" />
              Compartilhe este NFT
            </button>
          </div>
          <p role="status" aria-live="polite">
            {shareMessage}
          </p>
        </div>
        <Tabs.Root defaultValue="details" className="nft-description">
          <Tabs.List aria-label="Informações do NFT" className="detail-tabs">
            <Tabs.Trigger value="details">Detalhes do NFT</Tabs.Trigger>
            <Tabs.Trigger value="reviews" disabled title="Avaliações ainda indisponíveis">
              Avaliações de colecionadores ({nft.rating.count})
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="details">
            {nft.details.paragraphs.map((paragraph) => (
              <p className="text-copy text-[14px]" key={paragraph}>
                {paragraph}
              </p>
            ))}
            <h3>Rede:</h3>
            <p className="text-copy text-[14px]">{nft.details.network}</p>
            <h3>Contrato:</h3>
            <p className="text-copy text-[14px]">{nft.details.contract}</p>
            <h3>Direitos autorais:</h3>
            <p className="text-copy text-[14px]">{nft.details.royalties}</p>
          </Tabs.Content>
        </Tabs.Root>
        <section className="related" aria-label="Mais desta coleção">
          <h2>Mais desta coleção</h2>
          {relatedQuery.isPending ? (
            <NftCarousel label="coleção" />
          ) : relatedQuery.isError ? (
            <p role="alert">Não foi possível carregar a coleção.</p>
          ) : (
            <NftCarousel
              key={id}
              items={relatedQuery.data.items.filter((item) => item.id !== id)}
              label="coleção"
            />
          )}
        </section>
      </section>
    </>
  )
}
