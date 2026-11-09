import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

/**
 * <ConfirmDialog open title="Delete country?" message="..." confirmLabel="Delete" loading={busy} onConfirm={...} onClose={...} />
 */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading = false, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      width={420}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 12 }}>
        <span className="stat-icon" style={{ background: 'var(--err-s)', color: 'var(--err)', width: 38, height: 38 }}>
          <AlertTriangle size={18} />
        </span>
        <p style={{ marginTop: 8 }}>{message}</p>
      </div>
    </Modal>
  )
}
