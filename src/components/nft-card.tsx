import { SuccessMessage } from './success-message'
import { NftArt } from './nft-art'
import { NftPrice } from './nft-price'
import { Link } from '@tanstack/react-router'
import type { Nft } from '../contracts'
import { useAddToCart } from '../hooks/use-add-to-cart'
import { getErrorMessage } from '../lib/api'
import { Favorite } from './favorite'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export function NftCard({ nft }: { nft: Nft }) {
  const edition = nft.editions.find((item) => item.enabled)?.id ?? ''
  const { mutation, disabled } = useAddToCart(nft, edition, 1)
  return (
    <article className="nft-card">
      <NftArt nft={nft} linked>
        <div className="nft-card-actions">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={disabled}
                  aria-label={`Adicionar ${nft.name} ao carrinho`}
                  onClick={() => mutation.mutate()}
                >
                  <span className="asset-icon cart-icon" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar ao carrinho</TooltipContent>
            </Tooltip>
            <Favorite id={nft.id} iconOnly />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild>
                  <Link
                    to="/nfts/$id"
                    params={{ id: nft.id }}
                    aria-label={`Visualizar ${nft.name}`}
                  >
                    <span className="asset-icon search-icon" aria-hidden="true" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visualizar NFT</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </NftArt>
      <Link to="/nfts/$id" params={{ id: nft.id }} className="nft-name">
        {nft.name}
      </Link>
      <NftPrice nft={nft} />
      {mutation.isSuccess && (
        <SuccessMessage
          key={mutation.submittedAt}
          className="sr-only"
          message="Adicionado ao carrinho."
        />
      )}
      {mutation.isError && <p role="alert">{getErrorMessage(mutation.error)}</p>}
    </article>
  )
}
