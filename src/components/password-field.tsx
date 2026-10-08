import { useId, useState, type ComponentProps } from 'react'

type PasswordFieldProps = Omit<ComponentProps<'input'>, 'type'> & { label: string }

export function PasswordField({ label, id, ...props }: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-group">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-field">
        <input {...props} id={inputId} type={visible ? 'text' : 'password'} />
        <button
          type="button"
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={inputId}
          onClick={() => setVisible(!visible)}
        >
          <span
            className={`asset-icon ${visible ? 'eye-show-icon' : 'eye-hide-icon'}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
}
