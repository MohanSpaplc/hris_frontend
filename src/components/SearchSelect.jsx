import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { FloatingWrapper } from './FloatingField'

/**
 * Single select with a search box in the dropdown.
 * options: [{ value, label }]. onChange gets a select-like event, so it can replace FloatingSelect.
 * <SearchSelect label="Country" options={countries} value={id} onChange={(e) => setId(e.target.value)} />
 */
export default function SearchSelect({ label, options, value, onChange, required, disabled, error, hint, placeholder = 'Search…' }) {
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

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const selected = options.find((o) => String(o.value) === String(value ?? ''))
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))

  const choose = (optionValue) => {
    onChange({ target: { value: String(optionValue) } })
    setOpen(false)
    setQuery('')
  }

  return (
    <FloatingWrapper id={id} label={label} required={required} error={error} hint={hint} filled={Boolean(selected) || open}>
      {(describedBy) => (
        <div ref={rootRef} className="multi-select">
          <div
            id={id}
            className={`input search-select ${disabled ? 'is-disabled' : ''}`}
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-disabled={disabled || undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            onClick={() => !disabled && setOpen((o) => !o)}
            onKeyDown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && (e.preventDefault(), setOpen(true))}
          >
            <span className="search-select-value">{selected?.label ?? ''}</span>
            <ChevronDown size={16} className="multi-select-caret" aria-hidden="true" />
          </div>

          {open && (
            <div className="multi-select-menu">
              <div className="input-group">
                <span className="input-icon">
                  <Search size={14} />
                </span>
                <input
                  className="input input-sm"
                  autoFocus
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false)
                    if (e.key === 'Enter' && filtered.length) {
                      e.preventDefault()
                      choose(filtered[0].value)
                    }
                  }}
                />
              </div>
              <ul role="listbox">
                {filtered.length === 0 && <li className="muted multi-select-empty">No matches</li>}
                {filtered.map((option) => {
                  const isSelected = String(option.value) === String(value)
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      className={isSelected ? 'is-selected' : undefined}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        choose(option.value)
                      }}
                    >
                      <span className="search-select-check">{isSelected && <Check size={14} />}</span>
                      <span>{option.label}</span>
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
