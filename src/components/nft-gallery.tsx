import { useState } from 'react'
import { Dialog } from 'radix-ui'
import type { Nft } from '../contracts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

export function NftGallery({ nft }: { nft: Nft }) {
  const [imageIndex, setImageIndex] = useState(0)
  const selectedImage = nft.images[imageIndex] ?? nft.image

  return (
    <div className="nft-gallery">
      <div className="gallery-thumbnails">
        {nft.images.map((image, index) => (
          <button
            type="button"
            key={`${image}-${index}`}
            aria-label={`Ver imagem ${index + 1} de ${nft.name}`}
            aria-pressed={imageIndex === index}
            onClick={() => setImageIndex(index)}
          >
            <img src={image} alt="" width="100" height="100" />
          </button>
        ))}
      </div>
      <Dialog.Root>
        <div className="nft-card-art gallery-main">
          <img
            className="gallery-mobile-image"
            src={selectedImage}
            alt={nft.name}
            width="600"
            height="600"
          />
          <Dialog.Trigger className="gallery-art-image" aria-label="Ampliar imagem do NFT">
            <img id="obra" src={selectedImage} alt={nft.name} width="600" height="600" />
          </Dialog.Trigger>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Dialog.Trigger className="gallery-zoom" aria-label="Ampliar imagem">
                  <span className="asset-icon search-icon" aria-hidden="true" />
                </Dialog.Trigger>
              </TooltipTrigger>
              <TooltipContent side="left">Ampliar imagem</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content nft-image-modal" aria-describedby={undefined}>
            <Dialog.Close className="modal-close" aria-label="Fechar imagem">
              ×
            </Dialog.Close>
            <Dialog.Title>{nft.name}</Dialog.Title>
            <img src={selectedImage} alt={nft.name} width="640" height="640" />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
