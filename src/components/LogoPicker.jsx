import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import Button from './Button'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 1024 * 1024

/**
 * Logo chooser with preview. Calls onChange(file) for a new file, onChange(null) to remove.
 * `currentUrl` is the saved logo; `file` is the newly chosen one (not uploaded yet).
 */
export default function LogoPicker({ label = 'Logo', currentUrl, file, removed, onChange, onRemove, error }) {
  const inputId = useId()
  const inputRef = useRef(null)
  const [localError, setLocalError] = useState('')

  // Object URL for the chosen file; revoked when it changes to avoid leaking memory.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  const shownUrl = file ? previewUrl : removed ? null : currentUrl

  const handleFile = (event) => {
    const chosen = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again
    if (!chosen) return

    if (!ACCEPTED_TYPES.includes(chosen.type)) {
      setLocalError('Choose a JPG, PNG or WEBP image.')
      return
    }
    if (chosen.size > MAX_BYTES) {
      setLocalError('The logo must be 1 MB or smaller.')
      return
    }
    setLocalError('')
    onChange(chosen)
  }

  const message = localError || error

  return (
    <div className={`logo-picker ${message ? 'has-error' : ''}`}>
      <span className="switch-label">{label}</span>
      <div className="logo-picker-row">
        <div className="logo-preview">
          {shownUrl ? <img src={shownUrl} alt="Logo preview" /> : <ImagePlus size={22} aria-hidden="true" />}
        </div>
        <div className="logo-picker-actions">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="sr-only"
            onChange={handleFile}
          />
          <div className="row" style={{ gap: 6 }}>
            <Button variant="secondary" size="sm" icon={Upload} onClick={() => inputRef.current?.click()}>
              {shownUrl ? 'Change' : 'Upload logo'}
            </Button>
            {shownUrl && (
              <Button variant="ghost" size="sm" icon={Trash2} onClick={onRemove} style={{ color: 'var(--err)' }}>
                Remove
              </Button>
            )}
          </div>
          <small className={message ? 'logo-error' : 'muted'}>{message || 'JPG, PNG or WEBP · max 1 MB'}</small>
        </div>
      </div>
    </div>
  )
}
