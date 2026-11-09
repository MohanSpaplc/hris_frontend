import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Label + control + helper/error text.
 * <FormField label="Email" required error={errors.email} hint="Work email">{(id) => <input id={id} className="input" />}</FormField>
 */
export function FormField({ label, required, error, hint, children, className = '' }) {
  const id = useId()
  const messageId = `${id}-msg`

  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      {children(id, error || hint ? messageId : undefined)}
      {(error || hint) && (
        <small id={messageId} role={error ? 'alert' : undefined}>
          {error || hint}
        </small>
      )}
    </div>
  )
}

/** Text input with optional leading icon. */
export function TextInput({ label, required, error, hint, icon: Icon, className = '', ...props }) {
  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <div className="input-group">
          {Icon && (
            <span className="input-icon">
              <Icon size={16} aria-hidden="true" />
            </span>
          )}
          <input
            id={id}
            className="input"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            required={required}
            {...props}
          />
        </div>
      )}
    </FormField>
  )
}

/** Password input with show/hide toggle. */
export function PasswordInput({ label, required, error, hint, icon: Icon, className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <div className="input-group">
          {Icon && (
            <span className="input-icon">
              <Icon size={16} aria-hidden="true" />
            </span>
          )}
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            className="input"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            required={required}
            {...props}
          />
          <button
            type="button"
            className="input-action"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      )}
    </FormField>
  )
}
