import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Building2, CalendarClock, Eye, FileText, RefreshCw, Search, Star, Target, X } from 'lucide-react'
import { jobsApi } from '../../api/jobs'
import Button from '../../components/Button'
import DateInput from '../../components/DateInput'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass } from '../../utils/status'
import JobResumesTable from './JobResumesTable'
import { useJobLookups } from './useJobLookups'

const PRIORITY_ACCENT = { low: 'var(--info)', medium: 'var(--primary)', high: 'var(--warn)', urgent: 'var(--err)' }
const MAX_SKILLS = 4

// Local Date -> "2026-10-29" (toISOString would shift to UTC).
const toDateString = (date) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null
const years = (value) => (value == null ? '—' : `${Number(value)} ${Number(value) === 1 ? 'year' : 'years'}`)
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

/** /assigned-jobs: read-only cards of the jobs the logged-in user is assigned to. */
export default function AssignedJobs() {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const lookups = useJobLookups()
  const canViewResumes = can('candidates.view')

  // "N resumes attached" opens that job's resumes in a table under the cards (click again to close).
  const [selectedJob, setSelectedJob] = useState(null)
  const resumesRef = useRef(null)
  const showResumes = (job) => setSelectedJob((current) => (current?.id === job.id ? null : job))
  useEffect(() => {
    if (selectedJob) resumesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedJob])

  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [postedFrom, setPostedFrom] = useState(null)
  const [postedTo, setPostedTo] = useState(null)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())

  // While only the start date is picked, filter from that day onwards.
  const { rows, meta, loading, reload } = usePaginatedList(
    jobsApi.list,
    {
      page,
      per_page: 12,
      assigned_to_me: 1,
      search: debouncedSearch || undefined,
      status_id: statusId || undefined,
      posted_from: toDateString(postedFrom) ?? undefined,
      posted_to: toDateString(postedTo) ?? undefined,
    },
    'Could not load your assigned jobs.',
  )

  const hasFilters = Boolean(search || statusId || postedFrom || postedTo)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <div className="stack">
      <PageHeader
        title="Assigned Jobs"
        subtitle={meta ? `${meta.total} job${meta.total === 1 ? '' : 's'} assigned to you.` : 'Jobs you are assigned to as a recruiter.'}
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
            Refresh
          </Button>
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
              aria-label="Search assigned jobs"
              value={search}
              onChange={changeFilter(setSearch)}
              maxLength={100}
            />
          </div>
          <select className="input" value={statusId} onChange={changeFilter(setStatusId)} aria-label="Filter by status" style={{ width: 160 }}>
            <option value="">All statuses</option>
            {lookups.jobStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          <div style={{ width: 250 }}>
            <DateInput
              selectsRange
              startDate={postedFrom}
              endDate={postedTo}
              maxDate={new Date()}
              onChange={([from, to]) => {
                setPostedFrom(from)
                setPostedTo(to)
                setPage(1)
              }}
              placeholderText="Posted date range"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              icon={X}
              onClick={() => {
                setSearch('')
                setStatusId('')
                setPostedFrom(null)
                setPostedTo(null)
                setPage(1)
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {loading && !rows.length && (
        <div className="card card-body empty-state">
          <span className="btn btn-ghost is-loading">Loading your jobs…</span>
        </div>
      )}
      {!loading && !rows.length && (
        <div className="card card-body empty-state">
          <Briefcase size={28} style={{ marginBottom: 6 }} />
          <div>{hasFilters ? 'No assigned jobs match your filters.' : 'No jobs are assigned to you yet.'}</div>
        </div>
      )}

      <div className="assigned-grid" style={{ opacity: loading && rows.length ? 0.6 : 1 }}>
        {rows.map((job) => {
          const mine = job.recruiters?.find((recruiter) => recruiter.id === user?.id)
          const resumes = job.applications_count ?? 0
          const openPositions = Math.max(0, job.no_of_positions - job.positions_filled)
          const skills = job.primary_skills ?? []

          return (
            <article key={job.id} className={`assigned-card ${selectedJob?.id === job.id ? 'is-selected' : ''}`} style={{ '--accent': PRIORITY_ACCENT[job.priority] ?? 'var(--primary)' }}>
              <header className="assigned-card-top">
                <span className="assigned-code mono">{job.job_code}</span>
                {mine && (
                  <span className={`badge ${mine.is_primary ? 'badge-ok' : 'badge-info'}`} title={mine.is_primary ? 'You are the primary recruiter' : 'You are a recruiter on this job'}>
                    {mine.is_primary && <Star size={11} fill="currentColor" />} {mine.is_primary ? 'Primary' : 'Recruiter'}
                  </span>
                )}
                <span className={statusBadgeClass(job.status)}>{job.status?.name}</span>
                <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/assigned-jobs/${job.id}`)} aria-label={`View ${job.job_code}`} title="View job" />
                <span className="assigned-positions" title={`${openPositions} of ${job.no_of_positions} positions open`}>
                  <b>{openPositions}</b>
                  <small>open</small>
                </span>
              </header>

              <Link to={`/assigned-jobs/${job.id}`} className="assigned-title">
                {job.job_title}
              </Link>

              <div className="assigned-client">
                {job.client?.logo_url ? (
                  <img className="entity-logo" src={job.client.logo_url} alt="" loading="lazy" />
                ) : (
                  <span className="entity-logo is-fallback" aria-hidden="true">
                    <Building2 size={14} />
                  </span>
                )}
                <span>{job.is_internal ? 'Internal hiring' : job.client?.name}</span>
              </div>

              <div className="assigned-meta">
                <span>
                  <Briefcase size={14} /> Total exp: <b>{years(job.total_experience)}</b>
                </span>
                <span>
                  <Target size={14} /> Relevant exp: <b>{years(job.relevant_experience)}</b>
                </span>
              </div>
              <div className="assigned-meta">
                <span title={mine?.assigned_at ? `Assigned ${formatDateTime(mine.assigned_at)}` : undefined}>
                  <CalendarClock size={14} /> Posted {formatDateTime(job.created_at)}
                </span>
                {canViewResumes && resumes > 0 ? (
                  <button
                    type="button"
                    className="assigned-resumes"
                    aria-expanded={selectedJob?.id === job.id}
                    title="Show the resumes of this job below"
                    onClick={() => showResumes(job)}
                  >
                    <FileText size={14} /> <b>{resumes}</b> resume{resumes === 1 ? '' : 's'} attached
                  </button>
                ) : (
                  <span className="muted">
                    <FileText size={14} /> No resumes yet
                  </span>
                )}
              </div>

              {skills.length > 0 && (
                <footer className="assigned-skills">
                  {skills.slice(0, MAX_SKILLS).map((skill) => (
                    <span key={skill} className="tag tag-muted">
                      {skill}
                    </span>
                  ))}
                  {skills.length > MAX_SKILLS && <span className="muted">+{skills.length - MAX_SKILLS}</span>}
                </footer>
              )}
            </article>
          )
        })}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="card">
          <Pagination meta={meta} page={page} onPageChange={setPage} disabled={loading} />
        </div>
      )}

      {selectedJob && <JobResumesTable key={selectedJob.id} ref={resumesRef} job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  )
}
