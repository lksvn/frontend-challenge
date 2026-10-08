import { useState } from 'react'

export function EnsField({ defaultValue, errorId }: { defaultValue: string; errorId: string }) {
  const [name, setName] = useState(defaultValue.replace(/\.eth$/, ''))
  return (
    <div className="ens-field">
      <span aria-hidden="true">.eth</span>
      <input type="hidden" name="ens" value={name ? `${name}.eth` : ''} />
      <input
        required
        value={name}
        pattern="\S+"
        aria-describedby={errorId}
        onChange={(event) => setName(event.target.value.replace(/\.eth$/, ''))}
      />
    </div>
  )
}
