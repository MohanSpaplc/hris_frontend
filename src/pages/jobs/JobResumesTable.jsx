import { forwardRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, FileText, X } from 'lucide-react'
import { candidatesApi } from '../../api/candidates'
import Button from '../../components/Button'
import Pagination from '../../components/Pagination'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { statusBadgeClass } from '../../utils/status'

const COLUMN_COUNT = 6

const experienceText = (candidate) => {
  if (candidate.total_experience == null) return '—'
  const total = Number(candidate.total_experience)
  const relevant = candidate.relevant_experience == null ? null : Number(candidate.relevant_experience)
  return relevant == null ? `${total} yrs` : `${total} yrs (${relevant} rel.)`
}

/** Candidates tagged to one job, shown under the Assigned Jobs cards. */
const JobResumesTable = forwardRef(function JobResumesTable({ job, onClose }, ref) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { rows, meta, loading } = usePaginatedList(candidatesApi.list, { job_id: job.id, page, per_page: 10 }, 'Could not load the resumes.')

  return (
    <div className="card" ref={ref}>
      <div className="filter-bar">
        <FileText size={16} aria-hidden="true" />
        <b>
          Resumes · {job.job_code} · {job.job_title}
        </b>
        {meta && <span className="badge badge-info">{meta.total}</span>}
        <Button variant="ghost" icon={X} onClick={onClose} style={{ marginLeft: 'auto' }}>
          Close
        </Button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Contact</th>
              <th>Current role</th>
              <th>Experience</th>
              <th>Status</th>
              <th style={{ width: 70, textAlign: 'right' }}>View</th>
            </tr>
          </thead>
          <tbody>
            {loading && !rows.length && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="empty-state">
                  <span className="btn btn-ghost is-loading">Loading resumes…</span>
                </td>
              </tr>
            )}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="empty-state">
                  No resumes are attached to this job yet.
                </td>
              </tr>
            )}
            {rows.map((candidate) => (
              <tr key={candidate.id} style={{ opacity: loading ? 0.6 : 1 }}>
                <td>
                  <div className="mono muted">{candidate.candidate_code}</div>
                  <Link to={`/candidates/${candidate.id}`} className="job-link">
                    {candidate.full_name}
                  </Link>
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
                  <span className={statusBadgeClass(candidate.status)}>{candidate.status?.name}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/candidates/${candidate.id}`)} aria-label={`View ${candidate.candidate_code}`} title="View candidate" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} page={page} onPageChange={setPage} disabled={loading} />
    </div>
  )
})

export default JobResumesTable
