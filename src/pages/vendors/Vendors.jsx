import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Handshake, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { errorMessage } from '../../api/client'
import { statusesApi } from '../../api/countries'
import { vendorsApi } from '../../api/masters'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass } from '../../utils/status'
import VendorFormModal from './VendorFormModal'

const COLUMN_COUNT = 6

export default function Vendors() {
  const { can } = useAuth()

  const [statuses, setStatuses] = useState([])
  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { rows, meta, loading, reload } = usePaginatedList(
    vendorsApi.list,
    { page, per_page: 10, search: debouncedSearch || undefined, status_id: statusId || undefined },
    'Could not load vendors.',
  )

  useEffect(() => {
    statusesApi.list('general').then(setStatuses).catch(() => {})
  }, [])

  const hasFilters = Boolean(search || statusId)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const openForm = (vendor = null) => {
    setEditing(vendor)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await vendorsApi.remove(deleting.id)
      toast.success(`${deleting.name} deleted.`)
      setDeleting(null)
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else reload()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the vendor.'))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Vendors"
        subtitle="Staffing partners who submit candidates for your jobs."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
              Refresh
            </Button>
            {can('masters.create') && (
              <Button icon={Plus} onClick={() => openForm()}>
                Add vendor
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
              placeholder="Search name, email or contact"
              aria-label="Search vendors"
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
                <th>Vendor</th>
                <th>Contact person</th>
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
                    <span className="btn btn-ghost is-loading">Loading vendors…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <Handshake size={28} style={{ marginBottom: 6 }} />
                    <div>{hasFilters ? 'No vendors match your filters.' : 'No vendors yet.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((vendor) => (
                <tr key={vendor.id} style={{ opacity: loading ? 0.6 : 1 }}>
                  <td>
                    <div className="entity-cell">
                      <span className="entity-logo is-fallback" aria-hidden="true">
                        {vendor.name.slice(0, 2).toUpperCase()}
                      </span>
                      <b style={{ fontWeight: 500 }}>{vendor.name}</b>
                    </div>
                  </td>
                  <td>{vendor.contact_person || <span className="muted">—</span>}</td>
                  <td>{vendor.email || <span className="muted">—</span>}</td>
                  <td className="mono">{vendor.phone || '—'}</td>
                  <td>
                    <span className={statusBadgeClass(vendor.status)}>{vendor.status?.name}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions">
                      {can('masters.update') && (
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openForm(vendor)} aria-label={`Edit ${vendor.name}`} title="Edit" />
                      )}
                      {can('masters.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleting(vendor)}
                          aria-label={`Delete ${vendor.name}`}
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
        <VendorFormModal
          key={editing?.id ?? 'new'}
          vendor={editing}
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
        title="Delete vendor?"
        message={`${deleting?.name} will be removed from all lists.`}
        confirmLabel="Delete vendor"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
