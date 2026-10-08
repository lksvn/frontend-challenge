import { Summary } from './cart-items'
import { Button } from './ui/button'

export function CartSkeleton() {
  return (
    <div className="cart-layout cart-skeleton" aria-label="Carregando carrinho" aria-busy="true">
      <div className="cart-table" aria-hidden="true">
        <div className="cart-table-heading">
          <span>NFTs</span>
          <span>Preço</span>
          <span>Edições</span>
          <span>Total</span>
          <span />
        </div>
        {/* ponytail: reserva três itens enquanto a API não informa o tamanho do carrinho. */}
        {Array.from({ length: 3 }, (_, index) => (
          <article className="cart-row" key={index}>
            <div className="cart-nft">
              <div className="cart-image-placeholder skeleton" />
              <div>
                <h2 className="skeleton">Nome do NFT</h2>
                <p className="cart-token skeleton">ID do token: #000</p>
              </div>
            </div>
            <p className="cart-unit-price skeleton">0.00 ETH</p>
            <div className="cart-quantity skeleton">− 1 +</div>
            <p className="cart-line-total skeleton">0.00 ETH</p>
            <span />
          </article>
        ))}
      </div>
      <aside className="cart-summary">
        <h2>Resumo da carteira</h2>
        <div className="cart-coupon" aria-hidden="true">
          <label>Código promocional</label>
          <div>
            <input disabled placeholder="Digite o código promocional..." />
            <Button disabled>Aplicar</Button>
          </div>
        </div>
        <Summary cart />
        <Button className="mobile-primary-action" disabled>
          Conectar e finalizar
        </Button>
        <span className="cart-continue">Continuar explorando</span>
      </aside>
    </div>
  )
}
