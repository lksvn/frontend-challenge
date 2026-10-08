import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'

export function NftDetailSkeleton() {
  return (
    <>
      <nav className="breadcrumb" aria-label="Navegação estrutural">
        <Link to="/" search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}>
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          to="/"
          hash="catalogo"
          search={{ q: '', category: '', network: '', sort: 'recent', page: 1 }}
        >
          Mercado
        </Link>
      </nav>
      <section
        className="detail-layout nft-detail-layout detail-skeleton"
        aria-busy="true"
        aria-label="Carregando detalhe"
      >
        <div className="nft-gallery" aria-hidden="true">
          <div className="gallery-thumbnails">
            {/* ponytail: quatro miniaturas até a API informar a quantidade da galeria. */}
            {Array.from({ length: 4 }, (_, index) => (
              <div className="skeleton" key={index} />
            ))}
          </div>
          <div className="nft-card-art gallery-main">
            <div className="skeleton" />
          </div>
        </div>
        <div className="detail-information">
          <h1 className="skeleton" aria-hidden="true">
            Carregando NFT
          </h1>
          <div className="detail-price-rating" aria-hidden="true">
            <p className="price skeleton">0.00 ETH</p>
            <div className="nft-rating skeleton">★★★★★ · avaliações</div>
          </div>
          <h2 className="detail-about-title">Sobre este NFT:</h2>
          <p className="detail-description skeleton" aria-hidden="true">
            Carregando as informações da obra, coleção e seus atributos.
          </p>
          <div className="nft-purchase">
            <fieldset className="edition-options" disabled>
              <legend>Edição:</legend>
              <div className="skeleton edition-placeholder" aria-hidden="true" />
            </fieldset>
            <div className="nft-purchase-actions">
              <div className="quantity-control" aria-hidden="true">
                <span className="mobile-quantity-label">Qtd.</span>
                <Button disabled>−</Button>
                <output>1</output>
                <Button disabled>+</Button>
              </div>
              <div className="mobile-purchase-price skeleton" aria-hidden="true">
                0.00 ETH
              </div>
              <div className="purchase-buttons">
                <Button disabled className="purchase-primary mobile-primary-action font-bold">
                  <span className="desktop-purchase-label">COMPRAR</span>
                  <span className="mobile-purchase-label">Comprar NFT</span>
                </Button>
                <Button disabled className="mobile-cart-action" aria-label="Carregando carrinho">
                  <span className="asset-icon cart-icon" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
          <p className="detail-metadata skeleton" aria-hidden="true">
            ID do token
            <br />
            Coleção
            <br />
            Atributos
          </p>
          <div className="nft-share skeleton" aria-hidden="true">
            Compartilhe este NFT
          </div>
        </div>
      </section>
    </>
  )
}
