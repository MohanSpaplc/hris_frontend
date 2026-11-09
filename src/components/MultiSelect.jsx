import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search, Star, X } from 'lucide-react'
import { FloatingWrapper } from './FloatingField'

/**
 * Pick several options from a list, shown as chips.
 * options: [{ value, label, hint? }]. Optional "primary" marker with onPrimaryChange.
 * <MultiSelect label="Vendors" options={vendors} value={[1, 2]} onChange={setIds} />
 */
export default function MultiSelect({ label, options, value, onChange, error, hint, primary, onPrimaryChange, placeholder = 'Search…' }) {
  const id = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => !rootRef.current?.contains(event.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const selected = value.map((v) => options.find((o) => o.value === v) ?? { value: v, label: `#${v}` })
  const filtered = options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))

  const toggle = (optionValue) => {
    const next = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]
    onChange(next)
    if (onPrimaryChange && primary === optionValue && !next.includes(optionValue)) onPrimaryChange(next[0] ?? null)
    if (onPrimaryChange && !primary && next.length) onPrimaryChange(next[0])
  }

  return (
    <FloatingWrapper id={id} label={label} error={error} hint={hint} filled={value.length > 0 || open}>
      {(describedBy) => (
        <div ref={rootRef} className="multi-select">
          <div
            id={id}
            className="tag-box input"
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-describedby={describedBy}
            onClick={() => setOpen((o) => !o)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && (e.preventDefault(), setOpen(true))}
          >
            {selected.map((option) => (
              <span key={option.value} className={`tag ${primary === option.value ? 'is-primary' : ''}`}>
                {onPrimaryChange && (
                  <button
                    type="button"
                    title={primary === option.value ? 'Primary' : 'Make primary'}
                    aria-label={`Make ${option.label} primary`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPrimaryChange(option.value)
                    }}
                  >
                    <Star size={12} fill={primary === option.value ? 'currentColor' : 'none'} />
                  </button>
                )}
                {option.label}
                <button
                  type="button"
                  aria-label={`Remove ${option.label}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(option.value)
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <ChevronDown size={16} className="multi-select-caret" aria-hidden="true" />
          </div>

          {open && (
            <div className="multi-select-menu">
              <div className="input-group">
                <span className="input-icon">
                  <Search size={14} />
                </span>
                <input className="input input-sm" autoFocus placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <ul role="listbox" aria-multiselectable="true">
                {filtered.length === 0 && <li className="muted multi-select-empty">No matches</li>}
                {filtered.map((option) => {
                  const isSelected = value.includes(option.value)
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      className={isSelected ? 'is-selected' : undefined}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        toggle(option.value)
                      }}
                    >
                      <span className="multi-select-check">{isSelected && <Check size={13} />}</span>
                      <span>
                        {option.label}
                        {option.hint && <small className="muted"> · {option.hint}</small>}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </FloatingWrapper>
  )
}
