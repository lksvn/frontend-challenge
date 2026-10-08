export function CatalogSkeleton() {
  return (
    <div className="nft-grid" aria-label="Carregando NFTs" aria-busy="true">
      {Array.from({ length: 9 }, (_, index) => (
        <article className="nft-card nft-card-skeleton" key={index} aria-hidden="true">
          <div className="nft-card-art">
            <div className="skeleton" />
          </div>
          <span className="nft-name skeleton">Carregando NFT</span>
          <p className="price skeleton">0.00 ETH</p>
        </article>
      ))}
    </div>
  )
}
