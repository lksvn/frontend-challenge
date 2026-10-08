import { useEffect, useState } from 'react'
import { Slider } from 'radix-ui'
import { Link } from '@tanstack/react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Catalog, CatalogSearch } from '../contracts'
import { Button } from './ui/button'

interface CatalogFiltersProps {
  filters: Catalog['filters'] | undefined
  search: CatalogSearch
  updateSearch: (patch: Partial<CatalogSearch>) => void
  featuredQuery: UseQueryResult<Catalog, Error>
  mobileOpen?: boolean
}

export function CatalogFilters({
  filters,
  search,
  updateSearch,
  featuredQuery,
  mobileOpen = false,
}: CatalogFiltersProps) {
  const [range, setRange] = useState([Number(search.min || 0.02), Number(search.max || 12.3)])
  useEffect(() => {
    setRange([Number(search.min || 0.02), Number(search.max || 12.3)])
  }, [search.min, search.max])
  return (
    <aside className="catalog-sidebar" data-mobile-open={mobileOpen}>
      <div className="filters">
        <fieldset className="filter-group">
          <legend>Coleções</legend>
          {!filters &&
            Array.from({ length: 9 }, (_, index) => (
              <div className="filter-option-skeleton" key={index} aria-hidden="true">
                <span className="skeleton" />
              </div>
            ))}
          {filters?.categories.map(({ name, count }) => (
            <button
              type="button"
              key={name}
              aria-pressed={search.category === name}
              onClick={() => updateSearch({ category: search.category === name ? '' : name })}
              className="filter-option"
            >
              <span>{name}</span>
              <span className="font-bold">({count})</span>
            </button>
          ))}
        </fieldset>
        <fieldset className="filter-group price-filter">
          <legend>Faixa de preço</legend>
          <Slider.Root
            className="price-slider"
            min={0.02}
            max={12.3}
            step={0.01}
            minStepsBetweenThumbs={1}
            value={range}
            onValueChange={setRange}
          >
            <Slider.Track className="price-track">
              <Slider.Range className="price-range" />
            </Slider.Track>
            <Slider.Thumb className="price-thumb" aria-label="Preço mínimo em ETH" />
            <Slider.Thumb className="price-thumb" aria-label="Preço máximo em ETH" />
          </Slider.Root>
          <p className="price-filter-value">
            Preço:{' '}
            {range[0].toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            –{' '}
            {range[1].toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            ETH
          </p>
          <Button onClick={() => updateSearch({ min: String(range[0]), max: String(range[1]) })}>
            Aplicar
          </Button>
        </fieldset>
        <fieldset className="filter-group">
          <legend>Rede</legend>
          {!filters &&
            Array.from({ length: 3 }, (_, index) => (
              <div className="filter-option-skeleton" key={index} aria-hidden="true">
                <span className="skeleton" />
              </div>
            ))}
          {filters?.networks.map(({ name, count }) => (
            <button
              type="button"
              key={name}
              aria-pressed={search.network === name}
              onClick={() => updateSearch({ network: search.network === name ? '' : name })}
              className="filter-option"
            >
              <span>{name}</span>
              <span className="font-bold">({count})</span>
            </button>
          ))}
        </fieldset>
      </div>
      <section className="featured-nft" aria-label="NFT em destaque">
        <h2>NFT EM DESTAQUE</h2>
        <p className="featured-offer">OFERTA LIMITADA</p>
        {featuredQuery.isPending ? (
          <div className="skeleton" aria-label="Carregando NFT em destaque" />
        ) : featuredQuery.isError ? (
          <div>
            <p role="alert">Não foi possível carregar o destaque.</p>
            <Button variant="outline" onClick={() => void featuredQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : featuredQuery.data.items[0] ? (
          <Link
            to="/nfts/$id"
            params={{ id: featuredQuery.data.items[0].id }}
            aria-label={`Ver ${featuredQuery.data.items[0].name}`}
          >
            <img
              src={featuredQuery.data.items[0].image}
              alt={featuredQuery.data.items[0].name}
              width="220"
              height="220"
              loading="lazy"
            />
          </Link>
        ) : (
          <p>Nenhum destaque disponível.</p>
        )}
      </section>
    </aside>
  )
}
