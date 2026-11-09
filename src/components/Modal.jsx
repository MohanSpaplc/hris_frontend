import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * <Modal open={open} onClose={close} title="Approve offer" footer={<><Button variant="secondary">Cancel</Button><Button>Approve</Button></>}>...</Modal>
 * Esc and backdrop click close it; focus moves into the dialog and back on close.
 */
export default function Modal({ open, onClose, title, children, footer, width = 480 }) {
  const titleId = useId()
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const onKeyDown = (event) => event.key === 'Escape' && onClose()

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ width: `min(${width}px, 100%)` }}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
