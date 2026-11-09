import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { errorMessage } from '../../api/client'
import { myActivitiesApi } from '../../api/myActivities'
import Modal from '../../components/Modal'
import { stageBadgeClass } from '../../utils/status'

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

/** Every status change of one application, newest first. */
export default function StageHistoryModal({ application, onClose }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let cancelled = false
    myActivitiesApi
      .history(application.id)
      .then((data) => !cancelled && setRows(data))
      .catch((error) => {
        if (cancelled) return
        toast.error(errorMessage(error, 'Could not load the status history.'))
        setRows([])
      })
    return () => {
      cancelled = true
    }
  }, [application.id])

  return (
    <Modal open onClose={onClose} title={`Status History – ${application.candidate.full_name}`} width={560}>
      {rows === null && <span className="btn btn-ghost is-loading">Loading…</span>}
      {rows?.length === 0 && <p className="muted">No status changes yet.</p>}
      {rows?.length > 0 && (
        <div className="stack">
          {rows.map((row) => (
            <div key={row.id} style={{ borderLeft: '2px solid var(--line)', paddingLeft: 12 }}>
              <div>
                {row.from_stage && (
                  <>
                    <span className={stageBadgeClass(row.from_stage)}>{row.from_stage.name}</span>
                    <span className="muted"> → </span>
                  </>
                )}
                <span className={stageBadgeClass(row.to_stage)}>{row.to_stage.name}</span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {row.changed_by.name} · {formatDateTime(row.changed_at)}
              </div>
              {row.comments && <div style={{ marginTop: 4, whiteSpace: 'pre-line' }}>{row.comments}</div>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
