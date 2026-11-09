import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Eye, FileText, Pencil, Plus, RefreshCw, Search, Trash2, Users, X } from 'lucide-react'
import { candidatesApi, RESUME_SOURCES } from '../../api/candidates'
import { errorMessage } from '../../api/client'
import { jobsApi, labelFor } from '../../api/jobs'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../context/AuthContext'
import { useDebounced } from '../../hooks/useDebounced'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass } from '../../utils/status'
import { useCandidateLookups } from './useCandidateLookups'

const COLUMN_COUNT = 7

const experienceText = (candidate) => {
  if (candidate.total_experience == null) return '—'
  const total = Number(candidate.total_experience)
  const relevant = candidate.relevant_experience == null ? null : Number(candidate.relevant_experience)
  return relevant == null ? `${total} yrs` : `${total} yrs (${relevant} rel.)`
}

export default function Candidates() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const lookups = useCandidateLookups()

  const [search, setSearch] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusId, setStatusId] = useState('')
  const [source, setSource] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search.trim())
  const debouncedKeyword = useDebounced(keyword.trim())
  const debouncedMinExperience = useDebounced(minExperience)

  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // ?job_id= comes from "N resumes attached" on Assigned Jobs: show only that job's candidates.
  const [searchParams, setSearchParams] = useSearchParams()
  const jobId = searchParams.get('job_id') || ''
  const [jobFilter, setJobFilter] = useState(null) // { id, job_code, job_title }
  useEffect(() => {
    if (!jobId) return undefined
    let cancelled = false
    jobsApi
      .get(jobId)
      .then((job) => !cancelled && setJobFilter(job))
      .catch(() => !cancelled && setJobFilter(null))
    return () => {
      cancelled = true
    }
  }, [jobId])
  const clearJobFilter = () => {
    setSearchParams({})
    setPage(1)
  }

  const { rows, meta, loading, reload } = usePaginatedList(
    candidatesApi.list,
    {
      page,
      per_page: 10,
      job_id: jobId || undefined,
      search: debouncedSearch || undefined,
      keyword: debouncedKeyword || undefined,
      status_id: statusId || undefined,
      resume_source: source || undefined,
      min_experience: debouncedMinExperience || undefined,
    },
    'Could not load candidates.',
  )

  const hasFilters = Boolean(search || keyword || statusId || source || minExperience || jobId)
  const changeFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }
  const clearFilters = () => {
    setSearch('')
    setKeyword('')
    setStatusId('')
    setSource('')
    setMinExperience('')
    if (jobId) setSearchParams({})
    setPage(1)
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await candidatesApi.remove(deleting.id)
      toast.success(`${deleting.candidate_code} deleted.`)
      setDeleting(null)
      if (rows.length === 1 && page > 1) setPage((p) => p - 1)
      else reload()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the candidate.'))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title={jobId ? 'Resumes for job' : 'Candidates'}
        subtitle={
          jobId
            ? jobFilter
              ? `${jobFilter.job_code} · ${jobFilter.job_title}`
              : 'Loading job…'
            : 'Resume master: every candidate with their skills, experience and documents.'
        }
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>
              Refresh
            </Button>
            {can('candidates.create') && (
              <Button icon={Plus} onClick={() => navigate('/candidates/new')}>
                Add candidate
              </Button>
            )}
          </>
        }
      />

      <div className="card">
        <div className="filter-bar">
          {jobId && (
            <span className="tag" title="Showing only candidates tagged to this job">
              Job: {jobFilter?.job_code ?? `#${jobId}`}
              <button type="button" aria-label="Show all candidates" onClick={clearJobFilter}>
                <X size={12} />
              </button>
            </span>
          )}
          <div className="input-group">
            <span className="input-icon">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              className="input"
              type="search"
              placeholder="Name, code, email, phone, company"
              aria-label="Search candidates"
              value={search}
              onChange={changeFilter(setSearch)}
              maxLength={100}
            />
          </div>
          <div className="input-group" style={{ width: 220 }}>
            <span className="input-icon">
              <FileText size={16} aria-hidden="true" />
            </span>
            <input
              className="input"
              type="search"
              placeholder="Keyword in resume"
              aria-label="Search inside resumes"
              value={keyword}
              onChange={changeFilter(setKeyword)}
              maxLength={100}
            />
          </div>
          <input
            className="input"
            type="number"
            min={0}
            max={60}
            placeholder="Min exp. (yrs)"
            aria-label="Minimum experience in years"
            value={minExperience}
            onChange={changeFilter(setMinExperience)}
            style={{ width: 130 }}
          />
          <select className="input" value={source} onChange={changeFilter(setSource)} aria-label="Filter by source" style={{ width: 150 }}>
            <option value="">All sources</option>
            {RESUME_SOURCES.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
          <select className="input" value={statusId} onChange={changeFilter(setStatusId)} aria-label="Filter by status" style={{ width: 140 }}>
            <option value="">All statuses</option>
            {lookups.candidateStatuses.map((status) => (
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
                <th>Candidate</th>
                <th>Contact</th>
                <th>Current role</th>
                <th>Experience</th>
                <th>Skills</th>
                <th>Status</th>
                <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading candidates…</span>
                  </td>
                </tr>
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    <Users size={28} style={{ marginBottom: 6 }} />
                    <div>{hasFilters ? 'No candidates match your filters.' : 'No candidates yet.'}</div>
                  </td>
                </tr>
              )}
              {rows.map((candidate) => {
                const primarySkills = candidate.skills?.filter((skill) => skill.skill_type === 'primary') ?? []

                return (
                  <tr key={candidate.id} style={{ opacity: loading ? 0.6 : 1 }}>
                    <td>
                      <div className="mono muted">{candidate.candidate_code}</div>
                      <Link to={`/candidates/${candidate.id}`} className="job-link">
                        {candidate.full_name}
                      </Link>
                      {candidate.resume_source && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {labelFor(RESUME_SOURCES, candidate.resume_source)}
                          {candidate.vendor ? ` · ${candidate.vendor.name}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{candidate.email ?? <span className="muted">—</span>}</div>
                      <div className="muted mono" style={{ fontSize: 12 }}>{candidate.phone}</div>
                    </td>
                    <td>
                      {candidate.current_designation ?? <span className="muted">—</span>}
                      {candidate.current_company && <div className="muted" style={{ fontSize: 12 }}>{candidate.current_company}</div>}
                    </td>
                    <td>
                      {experienceText(candidate)}
                      {candidate.notice_period_days != null && <div className="muted" style={{ fontSize: 12 }}>{candidate.notice_period_days} days notice</div>}
                    </td>
                    <td>
                      {primarySkills.slice(0, 3).map((skill) => (
                        <span key={skill.id} className="tag" style={{ marginRight: 4 }}>
                          {skill.name}
                        </span>
                      ))}
                      {primarySkills.length > 3 && <span className="muted">+{primarySkills.length - 3}</span>}
                    </td>
                    <td>
                      <span className={statusBadgeClass(candidate.status)}>{candidate.status?.name}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions">
                        <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/candidates/${candidate.id}`)} aria-label={`View ${candidate.candidate_code}`} title="View" />
                        {can('candidates.update') && (
                          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => navigate(`/candidates/${candidate.id}/edit`)} aria-label={`Edit ${candidate.candidate_code}`} title="Edit" />
                        )}
                        {can('candidates.delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleting(candidate)}
                            aria-label={`Delete ${candidate.candidate_code}`}
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
        title="Delete candidate?"
        message={`${deleting?.candidate_code} · ${deleting?.full_name} will be removed from all lists. Their documents are kept.`}
        confirmLabel="Delete candidate"
        loading={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
