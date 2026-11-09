import { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useDebounced } from '../hooks/useDebounced'
import { FloatingWrapper } from './FloatingField'

/**
 * Free-text tags with optional suggestions (e.g. skills).
 * Enter or comma adds a tag; Backspace on an empty box removes the last one.
 * <TagInput label="Primary skills" value={['Java']} onChange={setSkills} fetchSuggestions={(q) => api(q)} />
 */
export default function TagInput({ label, value, onChange, fetchSuggestions, error, hint, maxTags = 30, maxLength = 150, required }) {
  const id = useId()
  const listId = `${id}-list`
  const inputRef = useRef(null)
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedText = useDebounced(text.trim(), 250)

  const has = (tag) => value.some((existing) => existing.toLowerCase() === tag.toLowerCase())

  useEffect(() => {
    if (!fetchSuggestions || !debouncedText) return undefined
    let cancelled = false
    fetchSuggestions(debouncedText)
      .then((names) => !cancelled && setSuggestions(names))
      .catch(() => !cancelled && setSuggestions([]))
    return () => {
      cancelled = true
    }
  }, [debouncedText, fetchSuggestions])

  const visibleSuggestions = debouncedText ? suggestions.filter((name) => !has(name)).slice(0, 8) : []

  const addTag = (raw) => {
    const tag = raw.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    if (tag && !has(tag) && value.length < maxTags) onChange([...value, tag])
    setText('')
    setActiveIndex(-1)
  }

  const removeTag = (tag) => onChange(value.filter((existing) => existing !== tag))

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      if (event.key === 'Tab' && !text.trim()) return
      event.preventDefault()
      addTag(activeIndex >= 0 ? visibleSuggestions[activeIndex] : text)
    } else if (event.key === 'Backspace' && !text && value.length) {
      removeTag(value[value.length - 1])
    } else if (event.key === 'ArrowDown' && visibleSuggestions.length) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => (i + 1) % visibleSuggestions.length)
    } else if (event.key === 'ArrowUp' && visibleSuggestions.length) {
      event.preventDefault()
      setActiveIndex((i) => (i <= 0 ? visibleSuggestions.length - 1 : i - 1))
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <FloatingWrapper id={id} label={label} required={required} error={error} hint={hint} filled={value.length > 0 || Boolean(text)}>
      {(describedBy) => (
        <div className="tag-box input" onClick={() => inputRef.current?.focus()}>
          {value.map((tag) => (
            <span key={tag} className="tag">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={id}
            value={text}
            maxLength={maxLength}
            onChange={(e) => {
              setText(e.target.value)
              setOpen(true)
              setActiveIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Suggestion clicks preventDefault, so blur only happens when leaving the field: keep what was typed.
              setOpen(false)
              if (text.trim()) addTag(text)
            }}
            role="combobox"
            aria-expanded={open && visibleSuggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          />
          {open && visibleSuggestions.length > 0 && (
            <ul id={listId} className="suggest-list" role="listbox">
              {visibleSuggestions.map((name, index) => (
                <li
                  key={name}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={index === activeIndex ? 'is-active' : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    addTag(name)
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </FloatingWrapper>
  )
}
