import { Fragment, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { ChevronDown, Globe2, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { countriesApi, statusesApi } from '../../api/countries'
import { errorMessage } from '../../api/client'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass } from '../../utils/status'
import CountryClientsRow from './CountryClientsRow'
import CountryFormModal from './CountryFormModal'

export default function Countries() {
  const { can } = useAuth()

  const [statuses, setStatuses] = useState([])

  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { rows, meta, loading, reload: load } = usePaginatedList(
    countriesApi.list,
    { page, per_page: 10, search: debouncedSearch || undefined, status_id: statusId || undefined },
    'Could not load countries.',
  )

  useEffect(() => {
    statusesApi.list('general').then(setStatuses).catch(() => {})
  }, [])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (country) => {
    setEditing(country)
    setFormOpen(true)
  }

  const handleSaved = () => {
    setFormOpen(false)
    load()
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await countriesApi.remove(deleting.id)
      toast.success(`${deleting.name} deleted.`)
      setDeleting(null)
      // Step back a page if we just removed the last row on it.
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else load()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the country.'))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Countries"
        subtitle="Countries, currencies and dial codes used for clients and jobs."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={load} disabled={loading}>
              Refresh
            </Button>
            {can('masters.create') && (
              <Button icon={Plus} onClick={openAdd}>
                Add country
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
              aria-label="Search countries"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              maxLength={100}
            />
          </div>
          <select className="input" value={statusId} onChange={(e) => {
              setStatusId(e.target.value)
              setPage(1)
            }} aria-label="Filter by status">
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          {(search || statusId) && (
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
                <th>Country</th>
                <th>Code</th>
                <th>Currency</th>
                <th>Dial code</th>
                <th>Timezone</th>
                <th>Clients</th>
                <th>Status</th>
                <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading countries…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <Globe2 size={28} style={{ marginBottom: 6 }} />
                    <div>{debouncedSearch || statusId ? 'No countries match your filters.' : 'No countries yet.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((country) => (
                <Fragment key={country.id}>
                <tr style={{ opacity: loading ? 0.6 : 1 }} className={expandedId === country.id ? 'is-expanded' : undefined}>
                  <td>
                    <span style={{ marginRight: 8 }}>{country.flag}</span>
                    <b style={{ fontWeight: 500 }}>{country.name}</b>
                  </td>
                  <td className="mono">
                    {country.code}
                    {country.iso3_code && <span className="muted"> / {country.iso3_code}</span>}
                  </td>
                  <td>
                    {country.currency_code ? (
                      <>
                        <span className="mono">{country.currency_code}</span>{' '}
                        <span className="muted">
                          {country.currency_symbol} {country.currency_name && `· ${country.currency_name}`}
                        </span>
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="mono">{country.dial_code || '—'}</td>
                  <td>{country.timezone || <span className="muted">—</span>}</td>
                  <td>
                    {country.clients_count > 0 ? (
                      <button
                        type="button"
                        className="count-link"
                        onClick={() => setExpandedId((id) => (id === country.id ? null : country.id))}
                        aria-expanded={expandedId === country.id}
                        title="Show clients"
                      >
                        {country.clients_count}
                        <ChevronDown size={14} className={expandedId === country.id ? 'is-open' : undefined} />
                      </button>
                    ) : (
                      <span className="muted">0</span>
                    )}
                  </td>
                  <td>
                    <span className={statusBadgeClass(country.status)}>{country.status?.name}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions">
                      {can('masters.update') && (
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(country)} aria-label={`Edit ${country.name}`} title="Edit" />
                      )}
                      {can('masters.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleting(country)}
                          aria-label={`Delete ${country.name}`}
                          title="Delete"
                          style={{ color: 'var(--err)' }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === country.id && <CountryClientsRow key={country.id} country={country} colSpan={8} />}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} page={page} onPageChange={setPage} disabled={loading} />
      </div>

      {formOpen && (
        <CountryFormModal
          key={editing?.id ?? 'new'}
          open
          country={editing}
          statuses={statuses}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete country?"
        message={
          deleting?.clients_count
            ? `${deleting.name} is used by ${deleting.clients_count} client(s), so it can't be deleted. Mark it Inactive instead.`
            : `${deleting?.name} will be permanently deleted. This can't be undone.`
        }
        confirmLabel="Delete country"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
