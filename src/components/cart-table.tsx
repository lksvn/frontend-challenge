import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CartItem } from '../contracts'
import { api, getErrorMessage } from '../lib/api'
import { Button } from './ui/button'

export function CartTable({ items }: { items: CartItem[] }) {
  const client = useQueryClient()
  const update = useMutation({
    mutationFn: ({ id, quantity, edition }: { id: string; quantity: number; edition: string }) =>
      api.put(`/cart/${id}`, { quantity, edition }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  return (
    <div className="cart-table">
      <div className="cart-table-heading" aria-hidden="true">
        <span>NFTs</span>
        <span>Preço</span>
        <span>Edições</span>
        <span>Total</span>
        <span />
      </div>
      {items.map(({ nft, quantity, edition, lineSubtotal }) => (
        <article className="cart-row" key={`${nft.id}:${edition}`}>
          <div className="cart-nft">
            <img src={nft.image} alt="" width="70" height="70" />
            <div>
              <h2>{nft.name}</h2>
              <p className="cart-token">ID do token: #{nft.tokenId}</p>
              <span className="cart-edition">
                Edição: {nft.editions.find((item) => item.id === edition)?.name}
              </span>
            </div>
          </div>
          <p className="cart-unit-price">
            <span className="sr-only">Preço: </span>
            {nft.price} ETH
          </p>
          <p className="cart-line-total">
            <span className="sr-only">Total: </span>
            {lineSubtotal} ETH
          </p>
          <div className="cart-controls">
            <div className="cart-quantity" role="group" aria-label={`Quantidade de ${nft.name}`}>
              <Button
                aria-label={`Diminuir quantidade de ${nft.name}`}
                disabled={quantity <= 1 || update.isPending}
                onClick={() => update.mutate({ id: nft.id, quantity: quantity - 1, edition })}
              >
                <span className="asset-icon minus-icon" aria-hidden="true" />
              </Button>
              <output aria-label={`Quantidade de ${nft.name}`} aria-live="polite">
                {quantity}
              </output>
              <Button
                aria-label={`Aumentar quantidade de ${nft.name}`}
                disabled={quantity >= nft.available || update.isPending}
                onClick={() => update.mutate({ id: nft.id, quantity: quantity + 1, edition })}
              >
                <span className="asset-icon plus-icon" aria-hidden="true" />
              </Button>
            </div>
            <button
              className="cart-remove"
              type="button"
              aria-label={`Remover ${nft.name}`}
              disabled={update.isPending}
              onClick={() => update.mutate({ id: nft.id, quantity: 0, edition })}
            >
              <span className="asset-icon delete-icon" aria-hidden="true" />
              <span className="cart-remove-label">Remover</span>
            </button>
          </div>
        </article>
      ))}
      {update.isError && <p role="alert">{getErrorMessage(update.error)}</p>}
    </div>
  )
}
