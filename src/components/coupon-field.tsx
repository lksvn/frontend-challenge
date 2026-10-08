import { useId, useState } from 'react'
import { Button } from './ui/button'

export function CouponField({
  coupon,
  onApply,
  pending,
}: {
  coupon: string
  onApply: (value: string) => void
  pending: boolean
}) {
  const id = useId()
  const [input, setInput] = useState(coupon)

  return (
    <div>
      <div className="cart-coupon">
        <label htmlFor={id}>Código promocional</label>
        <div>
          <input
            id={id}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                if (!pending) onApply(input)
              }
            }}
            placeholder="Digite o código promocional..."
          />
          <Button
            type="button"
            aria-label="Aplicar cupom"
            disabled={pending}
            onClick={() => onApply(input)}
          >
            Aplicar
          </Button>
        </div>
      </div>
      {coupon && (
        <button
          type="button"
          className="cart-remove-coupon"
          disabled={pending}
          onClick={() => {
            setInput('')
            onApply('')
          }}
        >
          <span aria-hidden="true">×</span>
          Remover cupom
        </button>
      )}
    </div>
  )
}
