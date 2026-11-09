import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { clientsApi } from '../../api/clients'
import { errorMessage } from '../../api/client'
import { statusBadgeClass } from '../../utils/status'

/** Expanded table row listing the clients that belong to one country. */
export default function CountryClientsRow({ country, colSpan }) {
  // `null` while loading; mounted fresh (keyed) for each country, so no reset is needed.
  const [clients, setClients] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    clientsApi
      .list({ country_id: country.id, per_page: 100 })
      .then((data) => !cancelled && setClients(data.data))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Could not load clients.')))
    return () => {
      cancelled = true
    }
  }, [country.id])

  return (
    <tr className="expand-row">
      <td colSpan={colSpan}>
        <div className="expand-panel">
          <div className="expand-title">
            <Building2 size={15} /> Clients in {country.name}
          </div>

          {error && <div className="muted">{error}</div>}
          {!error && clients === null && <span className="btn btn-ghost btn-sm is-loading">Loading clients…</span>}
          {!error && clients?.length === 0 && <div className="muted">No clients in this country.</div>}

          {!error && clients?.length > 0 && (
            <table className="table table-inner">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Managers</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 500 }}>{client.name}</td>
                    <td>{client.email || <span className="muted">—</span>}</td>
                    <td className="mono">{client.phone || '—'}</td>
                    <td>{client.managers_count ?? 0}</td>
                    <td>
                      <span className={statusBadgeClass(client.status)}>{client.status?.name}</span>
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
