import type { CartItem } from '../contracts'

export function PaymentItems({ items }: { items: CartItem[] }) {
  return (
    <div className="payment-items">
      <div className="payment-items-heading">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      {items.map(({ nft, quantity, edition, lineSubtotal }) => (
        <article className="payment-item" key={`${nft.id}:${edition}`}>
          <img src={nft.image} alt="" width="70" height="70" />
          <div>
            <h3>{nft.name}</h3>
            <p>ID do token: #{nft.tokenId}</p>
          </div>
          <span className="payment-item-quantity">(× {quantity})</span>
          <strong>{lineSubtotal} ETH</strong>
        </article>
      ))}
    </div>
  )
}
