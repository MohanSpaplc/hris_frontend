import { useId } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

/**
 * Outlined input with a floating label.
 * Empty: label sits inside the field like a placeholder.
 * Focused or filled: label moves up onto the top border.
 *
 * <FloatingInput label="Country name" required value={v} onChange={...} error={errors.name} />
 * <FloatingSelect label="Status" value={id} onChange={...}><option value="1">Active</option></FloatingSelect>
 */
export function FloatingWrapper({ id, label, required, error, hint, filled, children }) {
  const messageId = `${id}-msg`

  return (
    <div className={`float-field ${filled ? 'is-filled' : ''} ${error ? 'has-error' : ''}`}>
      <div className="float-control">
        {children(error || hint ? messageId : undefined)}
        <label htmlFor={id}>
          {label}
          {required && <span className="req"> *</span>}
        </label>
      </div>
      {(error || hint) && (
        <small id={messageId} role={error ? 'alert' : undefined}>
          {error || hint}
        </small>
      )}
    </div>
  )
}

export function FloatingInput({ label, required, error, hint, value, className = '', ...props }) {
  const id = useId()

  return (
    <FloatingWrapper id={id} label={label} required={required} error={error} hint={hint} filled={value !== '' && value != null}>
      {(describedBy) => (
        <input
          id={id}
          className={`input ${className}`}
          value={value ?? ''}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
      )}
    </FloatingWrapper>
  )
}

export function FloatingSelect({ label, required, error, hint, value, children, className = '', ...props }) {
  const id = useId()

  return (
    <FloatingWrapper id={id} label={label} required={required} error={error} hint={hint} filled={value !== '' && value != null}>
      {(describedBy) => (
        <select
          id={id}
          className={`input ${className}`}
          value={value ?? ''}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        >
          <option value="" disabled hidden />
          {children}
        </select>
      )}
    </FloatingWrapper>
  )
}

export function FloatingTextarea({ label, required, error, hint, value, className = '', rows = 3, ...props }) {
  const id = useId()

  return (
    <FloatingWrapper id={id} label={label} required={required} error={error} hint={hint} filled={value !== '' && value != null}>
      {(describedBy) => (
        <textarea
          id={id}
          rows={rows}
          className={`input ${className}`}
          value={value ?? ''}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
      )}
    </FloatingWrapper>
  )
}

/** Date picker with a floating label. value / onChange use Date objects (or null). */
export function FloatingDate({ label, required, error, hint, value, onChange, ...props }) {
  const id = useId()

  return (
    <FloatingWrapper id={id} label={label} required={required} error={error} hint={hint} filled={Boolean(value)}>
      {(describedBy) => (
        <DatePicker
          id={id}
          className="input"
          selected={value}
          onChange={onChange}
          dateFormat="dd MMM yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          isClearable
          autoComplete="off"
          ariaDescribedBy={describedBy}
          ariaInvalid={error ? 'true' : undefined}
          {...props}
        />
      )}
    </FloatingWrapper>
  )
}
