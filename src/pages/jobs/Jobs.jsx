import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Briefcase, Eye, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { errorMessage } from '../../api/client'
import { jobsApi, PRIORITIES, labelFor } from '../../api/jobs'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass } from '../../utils/status'
import { useJobLookups } from './useJobLookups'

const COLUMN_COUNT = 8
const PRIORITY_BADGE = { low: 'badge-info', medium: 'badge-primary', high: 'badge-warn', urgent: 'badge-err' }

const experienceText = (job) => {
  if (job.total_experience == null) return '—'
  const total = Number(job.total_experience)
  const relevant = job.relevant_experience == null ? null : Number(job.relevant_experience)
  return relevant == null ? `${total} yrs` : `${total} yrs (${relevant} rel.)`
}

export default function Jobs() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const lookups = useJobLookups()

  // Warm up the Create / Edit page (incl. the rich text editor) in the background, so opening it is instant.
  useEffect(() => {
    if (!can('jobs.create') && !can('jobs.update')) return undefined
    const warmUp = () => import('./JobFormPage')
    const handle = window.requestIdleCallback ? window.requestIdleCallback(warmUp) : window.setTimeout(warmUp, 1500)
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(handle) : window.clearTimeout(handle))
  }, [can])

  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [clientFilter, setClientFilter] = useState('') // '' | 'internal' | client id
  const [practiceAreaId, setPracticeAreaId] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { rows, meta, loading, reload } = usePaginatedList(
    jobsApi.list,
    {
      page,
      per_page: 10,
      search: debouncedSearch || undefined,
      status_id: statusId || undefined,
      client_id: clientFilter && clientFilter !== 'internal' ? clientFilter : undefined,
      job_type: clientFilter === 'internal' ? 'internal' : undefined,
      practice_area_id: practiceAreaId || undefined,
      priority: priority || undefined,
    },
    'Could not load jobs.',
  )

  const hasFilters = Boolean(search || statusId || clientFilter || practiceAreaId || priority)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }
  const clearFilters = () => {
    setSearch('')
    setStatusId('')
    setClientFilter('')
    setPracticeAreaId('')
    setPriority('')
    setPage(1)
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await jobsApi.remove(deleting.id)
      toast.success(`${deleting.job_code} deleted.`)
      setDeleting(null)
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else reload()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the job.'))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Jobs"
        subtitle="Open requirements for clients and internal hiring."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
              Refresh
            </Button>
            {can('jobs.create') && (
              <Button icon={Plus} onClick={() => navigate('/jobs/new')}>
                Create job
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
              placeholder="Search title or job code"
              aria-label="Search jobs"
              value={search}
              onChange={changeFilter(setSearch)}
              maxLength={100}
            />
          </div>
          <select className="input" value={clientFilter} onChange={changeFilter(setClientFilter)} aria-label="Filter by client" style={{ width: 200 }}>
            <option value="">All clients</option>
            <option value="internal">Internal jobs</option>
            {lookups.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <select className="input" value={practiceAreaId} onChange={changeFilter(setPracticeAreaId)} aria-label="Filter by practice area">
            <option value="">All practices</option>
            {lookups.practiceAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <select className="input" value={priority} onChange={changeFilter(setPriority)} aria-label="Filter by priority" style={{ width: 130 }}>
            <option value="">All priorities</option>
            {PRIORITIES.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
          <select className="input" value={statusId} onChange={changeFilter(setStatusId)} aria-label="Filter by status" style={{ width: 140 }}>
            <option value="">All statuses</option>
            {lookups.jobStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          {hasFilters && (
            <Button variant="ghost" icon={X} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Client</th>
                <th>Practice</th>
                <th>Experience</th>
                <th>Positions</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading jobs…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <Briefcase size={28} style={{ marginBottom: 6 }} />
                    <div>{hasFilters ? 'No jobs match your filters.' : 'No jobs yet.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((job) => {
                const primaryRecruiter = job.recruiters?.find((r) => r.is_primary)

                return (
                  <tr key={job.id} style={{ opacity: loading ? 0.6 : 1 }}>
                      <td>
                        <div className="mono muted">{job.job_code}</div>
                        <Link to={`/jobs/${job.id}`} className="job-link">
                          {job.job_title}
                        </Link>
                        {primaryRecruiter && (
                          <div className="muted" style={{ fontSize: 12 }}>
                            Recruiter: {primaryRecruiter.name}
                          </div>
                        )}
                      </td>
                      <td>
                        {job.is_internal ? (
                          <span className="badge badge-primary">Internal</span>
                        ) : (
                          <div className="entity-cell">
                            {job.client?.logo_url ? (
                              <img className="entity-logo" src={job.client.logo_url} alt="" loading="lazy" />
                            ) : (
                              <span className="entity-logo is-fallback" aria-hidden="true">
                                {job.client?.name?.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span>{job.client?.name}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {job.practice_area?.name}
                        <div className="mono muted">{job.country?.code}</div>
                      </td>
                      <td>{experienceText(job)}</td>
                      <td>
                        <b>{job.positions_filled}</b>
                        <span className="muted"> / {job.no_of_positions}</span>
                      </td>
                      <td>
                        <span className={`badge ${PRIORITY_BADGE[job.priority] ?? 'badge-info'}`}>{labelFor(PRIORITIES, job.priority)}</span>
                      </td>
                      <td>
                        <span className={statusBadgeClass(job.status)}>{job.status?.name}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions">
                          <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/jobs/${job.id}`)} aria-label={`View ${job.job_code}`} title="View" />
                          {can('jobs.update') && (
                            <Button variant="ghost" size="sm" icon={Pencil} onClick={() => navigate(`/jobs/${job.id}/edit`)} aria-label={`Edit ${job.job_code}`} title="Edit" />
                          )}
                          {can('jobs.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setDeleting(job)}
                              aria-label={`Delete ${job.job_code}`}
                              title="Delete"
                              style={{ color: 'var(--err)' }}
                            />
                          )}
                        </div>
                      </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} page={page} onPageChange={setPage} disabled={loading} />
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete job?"
        message={`${deleting?.job_code} · ${deleting?.job_title} will be removed from all lists. Its job code is not reused.`}
        confirmLabel="Delete job"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
