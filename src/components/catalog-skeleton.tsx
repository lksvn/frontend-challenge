export function CatalogSkeleton() {
  return (
    <div className="nft-grid" aria-label="Carregando NFTs" aria-busy="true">
      {Array.from({ length: 9 }, (_, index) => (
        <div key={index}>
          <div className="skeleton" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  )
}
