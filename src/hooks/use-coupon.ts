import { useState } from 'react'

export function useCoupon() {
  const [coupon, setCoupon] = useState(() => localStorage.getItem('kurio.coupon') ?? '')

  const applyCoupon = (value: string) => {
    setCoupon(value)
    localStorage.setItem('kurio.coupon', value)
  }

  return { coupon, applyCoupon }
}
