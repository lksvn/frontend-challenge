import { CartTable } from './cart-table'
import { SuccessMessage } from './success-message'
import { NftPrice } from './nft-price'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getErrorMessage } from '../lib/api'
import { useCart } from '../hooks/use-cart'
import { useAddToCart } from '../hooks/use-add-to-cart'
import type { CartItem, Nft, Quote } from '../contracts'
import { Button } from './ui/button'
import { Favorite } from './favorite'

export function AddToCart({ nft }: { nft: Nft }) {
  const cart = useCart()
  const itemCount = cart.data?.reduce((total, item) => total + item.quantity, 0) ?? 0
  const { id, available, editions } = nft
  const [edition, setEdition] = useState(editions.find((item) => item.enabled)?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const { mutation, remaining, disabled } = useAddToCart(nft, edition, quantity)
  return (
    <div className="nft-purchase">
      <fieldset className="edition-options">
        <legend>Edição:</legend>
        <div>
          {editions.map((item) => (
            <label key={item.id} title={item.enabled ? undefined : 'Edição indisponível'}>
              <input
                type="radio"
                name={`edition-${id}`}
                value={item.id}
                checked={edition === item.id}
                disabled={!item.enabled || mutation.isPending}
                onChange={() => setEdition(item.id)}
                className="sr-only"
              />
              <span>{item.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="nft-purchase-actions">
        <div className="quantity-control" role="group" aria-label="Escolher quantidade">
          <span className="mobile-quantity-label">Qtd.</span>
          <Button
            aria-label="Diminuir quantidade"
            disabled={quantity <= 1 || mutation.isPending}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          >
            <span className="asset-icon minus-icon" aria-hidden="true" />
          </Button>
          <output aria-label="Quantidade" aria-live="polite">
            {quantity}
          </output>
          <Button
            aria-label="Aumentar quantidade"
            disabled={quantity >= remaining || mutation.isPending}
            onClick={() => setQuantity((current) => Math.min(remaining, current + 1))}
          >
            <span className="asset-icon plus-icon" aria-hidden="true" />
          </Button>
        </div>
        <div className="mobile-purchase-price">
          <NftPrice nft={nft} />
        </div>
        <div className="purchase-buttons">
          <Button
            className="purchase-primary mobile-primary-action font-bold"
            disabled={disabled}
            onClick={() => mutation.mutate()}
          >
            {available ? (
              <>
                <span className="desktop-purchase-label">COMPRAR</span>
                <span className="mobile-purchase-label">Comprar NFT</span>
              </>
            ) : (
              'Edição esgotada'
            )}
          </Button>
          <Button asChild className="mobile-cart-action" variant="outline">
            <Link to="/cart" aria-label="Abrir carrinho" title={`Carrinho: ${itemCount} itens`}>
              <span className="asset-icon cart-icon" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="cart-count" aria-hidden="true">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
          <Favorite id={id} />
        </div>
        {mutation.isSuccess && (
          <SuccessMessage
            className="purchase-feedback"
            key={mutation.submittedAt}
            message="Adicionado ao carrinho."
          />
        )}
        {mutation.isError && (
          <p className="purchase-feedback" role="alert">
            {getErrorMessage(mutation.error)}
          </p>
        )}
      </div>
    </div>
  )
}

export function Summary({ quote, cart = false }: { quote: Quote; cart?: boolean }) {
  return (
    <dl className={cart ? 'summary summary-cart' : 'summary'}>
      <div>
        <dt>Subtotal</dt>
        <dd>{quote.subtotal} ETH</dd>
      </div>
      <div>
        <dt>{cart ? 'Desconto do lançamento' : 'Desconto'}</dt>
        <dd>
          {cart && '(-) '}
          {quote.discount}
        </dd>
      </div>
      <div>
        <dt>Taxa de rede</dt>
        <dd>
          {quote.fee} ETH
          {cart && <small className="cart-fee-estimate">Taxa estimada</small>}
        </dd>
      </div>
      <div className="price">
        <dt>Total</dt>
        <dd>{quote.total} ETH</dd>
      </div>
    </dl>
  )
}

export function CartItems({ items, editable = false }: { items: CartItem[]; editable?: boolean }) {
  if (editable) return <CartTable items={items} />

  return (
    <div>
      {items.map(({ nft, quantity, edition }) => (
        <article key={`${nft.id}:${edition}`} className="cart-item">
          <img src={nft.image} alt={nft.name} width="80" height="80" />
          <div>
            <h2>{nft.name}</h2>
            <NftPrice nft={nft} edition={edition} />
            <p>Quantidade: {quantity}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
