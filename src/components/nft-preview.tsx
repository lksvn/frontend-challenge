import { NftArt } from './nft-art'
import { NftPrice } from './nft-price'
import { Link } from '@tanstack/react-router'
import type { Nft } from '../contracts'

// Preview compartilhado das recomendações e dos NFTs da mesma coleção.
export function NftPreview({ nft }: { nft: Nft }) {
  return (
    <Link className="nft-card" to="/nfts/$id" params={{ id: nft.id }}>
      <NftArt nft={nft} />
      <h3>{nft.name}</h3>
      <NftPrice nft={nft} />
    </Link>
  )
}
