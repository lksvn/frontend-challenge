import { useEffect, useState } from 'react'

export function SuccessMessage({ message, className }: { message: string; className?: string }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3000)
    return () => window.clearTimeout(timer)
  }, [])

  return visible ? (
    <p className={className} role="status">
      {message}
    </p>
  ) : null
}
