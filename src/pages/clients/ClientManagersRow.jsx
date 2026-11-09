import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import { clientManagersApi } from '../../api/clients'
import { errorMessage } from '../../api/client'
import { statusBadgeClass } from '../../utils/status'

/** Expanded table row listing the managers of one client. Mounted fresh (keyed) per client. */
export default function ClientManagersRow({ client, colSpan }) {
  const [managers, setManagers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    clientManagersApi
      .list({ client_id: client.id, per_page: 100 })
      .then((data) => !cancelled && setManagers(data.data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load managers.')))
    return () => {
      cancelled = true
    }
  }, [client.id])

  return (
    <tr className="expand-row">
      <td colSpan={colSpan}>
        <div className="expand-panel">
          <div className="expand-title">
            <UserRound size={15} /> Managers at {client.name}
          </div>

          {error && <div className="muted">{error}</div>}
          {!error && managers === null && <span className="btn btn-ghost btn-sm is-loading">Loading managers…</span>}
          {!error && managers?.length === 0 && <div className="muted">No managers for this client.</div>}

          {!error && managers?.length > 0 && (
            <table className="table table-inner">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id}>
                    <td style={{ fontWeight: 500 }}>{manager.name}</td>
                    <td>{manager.email || <span className="muted">—</span>}</td>
                    <td className="mono">{manager.phone || '—'}</td>
                    <td>
                      <span className={statusBadgeClass(manager.status)}>{manager.status?.name}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </td>
    </tr>
  )
}
