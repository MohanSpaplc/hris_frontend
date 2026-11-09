import { Fragment, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Building2, ChevronDown, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { clientsApi } from '../../api/clients'
import { countriesApi, statusesApi } from '../../api/countries'
import { errorMessage } from '../../api/client'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass, statusIdFor } from '../../utils/status'
import ClientFormModal from './ClientFormModal'
import ClientManagersRow from './ClientManagersRow'

const COLUMN_COUNT = 7

export default function Clients() {
  const { can } = useAuth()

  const [statuses, setStatuses] = useState([])
  const [countries, setCountries] = useState([])

  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [countryId, setCountryId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const { rows, meta, loading, reload } = usePaginatedList(
    clientsApi.list,
    {
      page,
      per_page: 10,
      search: debouncedSearch || undefined,
      status_id: statusId || undefined,
      country_id: countryId || undefined,
    },
    'Could not load clients.',
  )

  // Dropdown data: general statuses, then active countries (for the filter and the form).
  useEffect(() => {
    statusesApi
      .list('general')
      .then((list) => {
        setStatuses(list)
        return countriesApi.list({ per_page: 100, sort: 'name', status_id: statusIdFor(list, true) })
      })
      .then((data) => setCountries(data.data))
      .catch(() => toast.error('Could not load countries for the filters.'))
  }, [])

  const hasFilters = Boolean(search || statusId || countryId)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const openForm = (client = null) => {
    setEditing(client)
    setFormOpen(true)
  }

  const handleSaved = () => {
    setFormOpen(false)
    reload()
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await clientsApi.remove(deleting.id)
      toast.success(`${deleting.name} deleted.`)
      setDeleting(null)
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else reload()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the client.'))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Clients"
        subtitle="Companies you hire for, with their country and contact details."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
              Refresh
            </Button>
            {can('masters.create') && (
              <Button icon={Plus} onClick={() => openForm()}>
                Add client
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
              aria-label="Search clients"
              value={search}
              onChange={changeFilter(setSearch)}
              maxLength={100}
            />
          </div>
          <select className="input" value={countryId} onChange={changeFilter(setCountryId)} aria-label="Filter by country">
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
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
                setCountryId('')
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
                <th>Client</th>
                <th>Country</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Managers</th>
                <th>Status</th>
                <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading clients…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <Building2 size={28} style={{ marginBottom: 6 }} />
                    <div>{hasFilters ? 'No clients match your filters.' : 'No clients yet.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((client) => {
                const isExpanded = expandedId === client.id

                return (
                  <Fragment key={client.id}>
                    <tr style={{ opacity: loading ? 0.6 : 1 }} className={isExpanded ? 'is-expanded' : undefined}>
                      <td>
                        <div className="entity-cell">
                          {client.logo_url ? (
                            <img className="entity-logo" src={client.logo_url} alt="" loading="lazy" />
                          ) : (
                            <span className="entity-logo is-fallback" aria-hidden="true">
                              {client.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <b style={{ fontWeight: 500 }}>{client.name}</b>
                            {client.address && (
                              <div className="muted" style={{ fontSize: 12 }}>
                                {client.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {client.country?.name} <span className="mono muted">{client.country?.code}</span>
                      </td>
                      <td>{client.email || <span className="muted">—</span>}</td>
                      <td className="mono">{client.phone || '—'}</td>
                      <td>
                        {client.managers_count > 0 ? (
                          <button
                            type="button"
                            className="count-link"
                            onClick={() => setExpandedId(isExpanded ? null : client.id)}
                            aria-expanded={isExpanded}
                            title="Show managers"
                          >
                            {client.managers_count}
                            <ChevronDown size={14} className={isExpanded ? 'is-open' : undefined} />
                          </button>
                        ) : (
                          <span className="muted">0</span>
                        )}
                      </td>
                      <td>
                        <span className={statusBadgeClass(client.status)}>{client.status?.name}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions">
                          {can('masters.update') && (
                            <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openForm(client)} aria-label={`Edit ${client.name}`} title="Edit" />
                          )}
                          {can('masters.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setDeleting(client)}
                              aria-label={`Delete ${client.name}`}
                              title="Delete"
                              style={{ color: 'var(--err)' }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <ClientManagersRow key={client.id} client={client} colSpan={COLUMN_COUNT} />}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} page={page} onPageChange={setPage} disabled={loading} />
      </div>

      {formOpen && (
        <ClientFormModal
          key={editing?.id ?? 'new'}
          client={editing}
          countries={countries}
          statuses={statuses}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete client?"
        message={
          deleting?.managers_count
            ? `${deleting.name} and its ${deleting.managers_count} manager(s) will be removed from all lists.`
            : `${deleting?.name} will be removed from all lists.`
        }
        confirmLabel="Delete client"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
