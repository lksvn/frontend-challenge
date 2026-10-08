import { useSearch, useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Dialog } from 'radix-ui'
import { api } from '../lib/api'
import type { Catalog, CatalogSearch } from '../contracts'
import { Button } from '../components/ui/button'
import { CatalogFilters } from '../components/catalog-filters'
import { CatalogSkeleton } from '../components/catalog-skeleton'
import { HomeExtras } from '../components/home-extras'
import { HeroCarousel } from '../components/hero-carousel'
import { NftCard } from '../components/nft-card'

export function CatalogPage() {
  const routeSearch = useSearch({ strict: false })
  const search: CatalogSearch = {
    view: 'all',
    q: '',
    category: '',
    network: '',
    sort: 'recent',
    page: 1,
    ...routeSearch,
  }
  const navigate = useNavigate({ from: '/' })
  const listStart = useRef<HTMLDivElement>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const catalogQuery = useQuery({
    queryKey: ['nfts', search],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) =>
      (await api.get<Catalog>('/nfts', { params: search, signal })).data,
  })
  const featuredQuery = useQuery({
    queryKey: ['nfts', 'featured'],
    queryFn: async ({ signal }) =>
      (await api.get<Catalog>('/nfts', { params: { featured: true }, signal })).data,
  })
  const updateSearch = (patch: Partial<CatalogSearch>) =>
    navigate({
      search: { ...search, ...patch, page: patch.page ?? 1 },
      resetScroll: false,
    })
  const changePage = async (page: number) => {
    await updateSearch({ page })
    listStart.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
      <div className="mobile-catalog-search">
        <form
          role="search"
          aria-label="Busca mobile de NFTs"
          onSubmit={(event) => {
            event.preventDefault()
            void updateSearch({
              q: String(new FormData(event.currentTarget).get('q') ?? '').trim(),
            })
          }}
        >
          <span className="asset-icon search-icon" aria-hidden="true" />
          <input
            key={search.q}
            name="q"
            type="search"
            aria-label="Explorar coleções"
            placeholder="Explorar coleções"
            defaultValue={search.q}
          />
        </form>
        <Dialog.Trigger asChild>
          <button type="button" className="mobile-filter-toggle" aria-label="Filtros do catálogo">
            <span className="asset-icon mobile-filter-icon" aria-hidden="true" />
          </button>
        </Dialog.Trigger>
      </div>
      <HeroCarousel />
      <section id="catalogo" className="catalog-layout" aria-label="Catálogo de NFTs">
        <CatalogFilters
          filters={catalogQuery.data?.filters}
          search={search}
          updateSearch={updateSearch}
          featuredQuery={featuredQuery}
        />
        <div ref={listStart}>
          <div className="catalog-toolbar">
            <h2 className="sr-only">Todos os NFTs</h2>
            <nav className="catalog-views" aria-label="Seleção do catálogo">
              {[
                { value: 'all', label: 'Todos os NFTs' },
                { value: 'new', label: 'Novos lançamentos' },
                { value: 'trending', label: 'Em alta' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-current={search.view === value ? 'true' : undefined}
                  onClick={() => void updateSearch({ view: value as CatalogSearch['view'] })}
                >
                  {label}
                </button>
              ))}
            </nav>
            <label className="catalog-sort">
              Ordenar por:
              <span className="catalog-sort-control">
                <select
                  value={search.sort}
                  onChange={(event) =>
                    updateSearch({ sort: event.target.value as CatalogSearch['sort'] })
                  }
                >
                  <option value="recent">Listados recentemente</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                </select>
                <span className="catalog-sort-chevron" aria-hidden="true" />
              </span>
            </label>
          </div>
          {catalogQuery.isError && catalogQuery.data && (
            <div role="alert">
              Não foi possível carregar a atualização do catálogo. Exibindo os últimos dados
              recebidos.
              <Button onClick={() => void catalogQuery.refetch()}>Tentar novamente</Button>
            </div>
          )}
          {catalogQuery.isPending ? (
            <CatalogSkeleton />
          ) : !catalogQuery.data ? (
            <div role="alert">
              <p>Não foi possível carregar o catálogo.</p>
              <Button onClick={() => void catalogQuery.refetch()}>Tentar novamente</Button>
            </div>
          ) : (
            <>
              <p className="text-copy text-[14px]" role="status">
                {catalogQuery.data.total} resultados
                {catalogQuery.isFetching ? ' · Carregando' : ''}
              </p>
              {catalogQuery.data.items.length === 0 ? (
                <p>Nenhum NFT encontrado.</p>
              ) : (
                <div className="nft-grid">
                  {catalogQuery.data.items.map((nft) => (
                    <NftCard key={nft.id} nft={nft} />
                  ))}
                </div>
              )}
              {catalogQuery.data.total > 0 && (
                <nav aria-label="Paginação" className="pagination">
                  {search.page > 1 && catalogQuery.data.pages > 1 && (
                    <button
                      type="button"
                      aria-label="Página anterior"
                      onClick={() => void changePage(search.page - 1)}
                    >
                      <span className="pagination-chevron rotate-180" aria-hidden="true" />
                    </button>
                  )}
                  {Array.from({ length: catalogQuery.data.pages }, (_, index) => (
                    <button
                      type="button"
                      key={index}
                      aria-current={search.page === index + 1 ? 'page' : undefined}
                      onClick={() => void changePage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  {search.page < catalogQuery.data.pages && (
                    <button
                      type="button"
                      aria-label="Próxima página"
                      onClick={() => void changePage(search.page + 1)}
                    >
                      <span className="pagination-chevron" aria-hidden="true" />
                    </button>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
      <HomeExtras />
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content mobile-filters-panel"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Filtros do catálogo</Dialog.Title>
          <Dialog.Close className="modal-close" aria-label="Fechar filtros">
            ×
          </Dialog.Close>
          <div className="mobile-filters-body">
            <CatalogFilters
              filters={catalogQuery.data?.filters}
              search={search}
              updateSearch={updateSearch}
              featuredQuery={featuredQuery}
              mobileOpen
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
