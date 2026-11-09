import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Layers, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { errorMessage } from '../../api/client'
import { statusesApi } from '../../api/countries'
import { practiceAreasApi, usersApi } from '../../api/masters'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass, statusIdFor } from '../../utils/status'
import PracticeAreaFormModal from './PracticeAreaFormModal'

const COLUMN_COUNT = 5

export default function PracticeAreas() {
  const { can } = useAuth()

  const [statuses, setStatuses] = useState([])
  const [users, setUsers] = useState([])

  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { rows, meta, loading, reload } = usePaginatedList(
    practiceAreasApi.list,
    { page, per_page: 10, search: debouncedSearch || undefined, status_id: statusId || undefined },
    'Could not load practice areas.',
  )

  useEffect(() => {
    statusesApi.list('general').then(setStatuses).catch(() => {})
  }, [])

  // Active users for the "Practice head" dropdown (only roles that may view users get the list).
  const canEdit = can('masters.create') || can('masters.update')
  useEffect(() => {
    if (!canEdit || !can('users.view') || !statuses.length) return
    usersApi
      .list({ per_page: 100, status_id: statusIdFor(statuses, true) })
      .then((data) => setUsers(data.data))
      .catch(() => {})
  }, [canEdit, can, statuses])

  const hasFilters = Boolean(search || statusId)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const openForm = (area = null) => {
    setEditing(area)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await practiceAreasApi.remove(deleting.id)
      toast.success(`${deleting.name} deleted.`)
      setDeleting(null)
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else reload()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the practice area.'))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Practice Areas"
        subtitle="Technology and service lines that jobs are grouped under."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
              Refresh
            </Button>
            {can('masters.create') && (
              <Button icon={Plus} onClick={() => openForm()}>
                Add practice area
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
              placeholder="Search name or code"
              aria-label="Search practice areas"
              value={search}
              onChange={changeFilter(setSearch)}
              maxLength={100}
            />
          </div>
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
                <th>Practice area</th>
                <th>Code</th>
                <th>Practice head</th>
                <th>Status</th>
                <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading practice areas…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <Layers size={28} style={{ marginBottom: 6 }} />
                    <div>{hasFilters ? 'No practice areas match your filters.' : 'No practice areas yet.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((area) => (
                <tr key={area.id} style={{ opacity: loading ? 0.6 : 1 }}>
                  <td>
                    <b style={{ fontWeight: 500 }}>{area.name}</b>
                  </td>
                  <td className="mono">{area.code}</td>
                  <td>
                    {area.head ? (
                      <div className="entity-cell">
                        <span className="avatar">{area.head.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
                        <div>
                          {area.head.name}
                          <div className="muted" style={{ fontSize: 12 }}>
                            {area.head.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className={statusBadgeClass(area.status)}>{area.status?.name}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions">
                      {can('masters.update') && (
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openForm(area)} aria-label={`Edit ${area.name}`} title="Edit" />
                      )}
                      {can('masters.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleting(area)}
                          aria-label={`Delete ${area.name}`}
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
        <PracticeAreaFormModal
          key={editing?.id ?? 'new'}
          area={editing}
          users={users}
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
        title="Delete practice area?"
        message={`${deleting?.name} will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete practice area"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
