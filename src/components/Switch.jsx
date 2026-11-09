import { useId } from 'react'

/**
 * Toggle switch.
 * <Switch label="Status" checked={isActive} onChange={setIsActive} onText="Active" offText="Inactive" />
 */
export default function Switch({ label, checked, onChange, onText = 'On', offText = 'Off', disabled = false, error }) {
  const id = useId()

  return (
    <div className={`switch-field ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={id} className="switch-label">
          {label}
        </label>
      )}
      <label className={`switch ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''}`}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
        <span className="switch-text">{checked ? onText : offText}</span>
      </label>
      {error && <small role="alert">{error}</small>}
    </div>
  )
}
