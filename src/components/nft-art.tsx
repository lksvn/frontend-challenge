import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { Nft } from '../contracts'

export function NftArt({
  nft,
  linked = false,
  children,
}: {
  nft: Nft
  linked?: boolean
  children?: ReactNode
}) {
  const image = <img src={nft.image} alt={nft.name} width="320" height="320" loading="lazy" />
  return (
    <div className="nft-card-art">
      {linked ? (
        <Link to="/nfts/$id" params={{ id: nft.id }} aria-label={`Ver ${nft.name}`}>
          {image}
        </Link>
      ) : (
        image
      )}
      {nft.rarity && <span className="nft-rarity">{nft.rarity}</span>}
      {children}
    </div>
  )
}
