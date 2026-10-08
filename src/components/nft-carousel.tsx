import { useLayoutEffect, useRef, useState } from 'react'
import type { Nft } from '../contracts'
import { NftPreview } from './nft-preview'

export function NftCarousel({ items, label = 'recomendações' }: { items: Nft[]; label?: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [cardsPerPage, setCardsPerPage] = useState(5)
  useLayoutEffect(() => {
    const element = track.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      setCardsPerPage(width < 600 ? 2 : width < 900 ? 3 : 5)
      setPage(0)
      element.scrollTo({ left: 0 })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const pages = Math.ceil(items.length / cardsPerPage)
  return (
    <>
      <div
        className="recommendations-track"
        ref={track}
        onScroll={(event) =>
          setPage(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))
        }
      >
        {Array.from({ length: pages }, (_, index) => (
          <div
            className="recommendations-page"
            style={{ gridTemplateColumns: `repeat(${cardsPerPage}, minmax(0, 1fr))` }}
            key={index}
            inert={page !== index}
            aria-hidden={page !== index}
          >
            {items.slice(index * cardsPerPage, (index + 1) * cardsPerPage).map((nft) => (
              <NftPreview key={nft.id} nft={nft} />
            ))}
          </div>
        ))}
      </div>
      <nav className="recommendations-dots" aria-label={`Páginas de ${label}`}>
        {Array.from({ length: pages }, (_, index) => (
          <button
            type="button"
            key={index}
            aria-label={`Ver ${label} ${index + 1}`}
            aria-current={page === index ? 'true' : undefined}
            onClick={() => track.current?.scrollTo({ left: index * track.current.clientWidth })}
          />
        ))}
      </nav>
    </>
  )
}
