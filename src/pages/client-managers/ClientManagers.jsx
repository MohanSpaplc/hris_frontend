import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Pencil, Plus, RefreshCw, Search, Trash2, UserRound, X } from 'lucide-react'
import { clientManagersApi, clientsApi } from '../../api/clients'
import { errorMessage } from '../../api/client'
import { statusesApi } from '../../api/countries'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass, statusIdFor } from '../../utils/status'
import ClientManagerFormModal from './ClientManagerFormModal'

const COLUMN_COUNT = 6
const initialsOf = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

export default function ClientManagers() {
  const { can } = useAuth()

  const [statuses, setStatuses] = useState([])
  const [clients, setClients] = useState([])

  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [clientId, setClientId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { rows, meta, loading, reload } = usePaginatedList(
    clientManagersApi.list,
    {
      page,
      per_page: 10,
      search: debouncedSearch || undefined,
      status_id: statusId || undefined,
      client_id: clientId || undefined,
    },
    'Could not load client managers.',
  )

  // Dropdown data: general statuses, then active clients A–Z (for the filter and the form).
  useEffect(() => {
    statusesApi
      .list('general')
      .then((list) => {
        setStatuses(list)
        return clientsApi.list({ per_page: 100, sort: 'name', status_id: statusIdFor(list, true) })
      })
      .then((data) => setClients(data.data))
      .catch(() => toast.error('Could not load clients for the filters.'))
  }, [])

  const hasFilters = Boolean(search || statusId || clientId)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const openForm = (manager = null) => {
    setEditing(manager)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await clientManagersApi.remove(deleting.id)
      toast.success(`${deleting.name} deleted.`)
      setDeleting(null)
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else reload()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the client manager.'))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Client Managers"
        subtitle="Hiring managers and contacts at each client."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
              Refresh
            </Button>
            {can('masters.create') && (
              <Button icon={Plus} onClick={() => openForm()}>
                Add manager
              </Button>
            )}
          </>
        }
      />

      <div className="card">
        <div className="filter-bar">
          <div className="input-group">
            <span className="input-icon">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              className="input"
              type="search"
              placeholder="Search name or email"
              aria-label="Search client managers"
              value={search}
              onChange={changeFilter(setSearch)}
              maxLength={100}
            />
          </div>
          <select className="input" value={clientId} onChange={changeFilter(setClientId)} aria-label="Filter by client" style={{ width: 220 }}>
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <select className="input" value={statusId} onChange={changeFilter(setStatusId)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          {hasFilters && (
            <Button
              variant="ghost"
              icon={X}
              onClick={() => {
                setSearch('')
                setStatusId('')
                setClientId('')
                setPage(1)
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Manager</th>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading client managers…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <UserRound size={28} style={{ marginBottom: 6 }} />
                    <div>{hasFilters ? 'No client managers match your filters.' : 'No client managers yet.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((manager) => (
                <tr key={manager.id} style={{ opacity: loading ? 0.6 : 1 }}>
                  <td>
                    <div className="entity-cell">
                      <span className="avatar">{initialsOf(manager.name)}</span>
                      <b style={{ fontWeight: 500 }}>{manager.name}</b>
                    </div>
                  </td>
                  <td>{manager.client?.name ?? <span className="muted">—</span>}</td>
                  <td>{manager.email || <span className="muted">—</span>}</td>
                  <td className="mono">{manager.phone || '—'}</td>
                  <td>
                    <span className={statusBadgeClass(manager.status)}>{manager.status?.name}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions">
                      {can('masters.update') && (
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openForm(manager)} aria-label={`Edit ${manager.name}`} title="Edit" />
                      )}
                      {can('masters.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleting(manager)}
                          aria-label={`Delete ${manager.name}`}
                          title="Delete"
                          style={{ color: 'var(--err)' }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} page={page} onPageChange={setPage} disabled={loading} />
      </div>

      {formOpen && (
        <ClientManagerFormModal
          key={editing?.id ?? 'new'}
          manager={editing}
          clients={clients}
          statuses={statuses}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete client manager?"
        message={`${deleting?.name}${deleting?.client ? ` (${deleting.client.name})` : ''} will be removed from all lists.`}
        confirmLabel="Delete manager"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
