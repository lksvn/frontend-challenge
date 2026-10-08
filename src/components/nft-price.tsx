import type { Nft } from '../contracts'

export function NftPrice({ nft, edition }: { nft: Nft; edition?: string }) {
  return (
    <p className="price">
      <span className="price-current">{nft.price} ETH</span>
      {nft.originalPrice && nft.originalPrice !== nft.price && (
        <span className="price-discount">
          <span className="sr-only">Preço anterior: </span>
          {nft.originalPrice} ETH
        </span>
      )}
      {edition && ` · ${edition}`}
    </p>
  )
}
