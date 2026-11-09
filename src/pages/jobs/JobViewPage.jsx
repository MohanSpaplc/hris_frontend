import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import DOMPurify from 'dompurify'
import { ArrowLeft, Download, FileText, Pencil, Star, Trash2 } from 'lucide-react'
import { errorMessage } from '../../api/client'
import { EMPLOYMENT_TYPES, jobsApi, JOB_TYPES, labelFor, PRIORITIES, WORK_MODES } from '../../api/jobs'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { statusBadgeClass } from '../../utils/status'

const PRIORITY_BADGE = { low: 'badge-info', medium: 'badge-primary', high: 'badge-warn', urgent: 'badge-err' }

const formatDate = (value) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null
const formatMoney = (value, currency) =>
  value == null ? null : `${currency ?? ''} ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`.trim()
const years = (value) => (value == null ? null : `${Number(value)} years`)

/** Read-only field laid out like the form's floating inputs. */
function Field({ label, children, wide = false }) {
  const empty = children === null || children === undefined || children === '' || (Array.isArray(children) && children.length === 0)

  return (
    <div className={`view-field ${wide ? 'span-3' : ''}`}>
      <span className="view-label">{label}</span>
      <div className="view-value">{empty ? <span className="muted">—</span> : children}</div>
    </div>
  )
}

/**
 * /jobs/:id, and /assigned-jobs/:id with `readOnly`: no edit / delete, back to Assigned Jobs.
 */
export default function JobViewPage({ readOnly = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const listPath = readOnly ? '/assigned-jobs' : '/jobs'
  const [job, setJob] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    jobsApi
      .get(id)
      .then((data) => !cancelled && setJob(data))
      .catch((error) => !cancelled && setLoadError(errorMessage(error, 'Could not load the job.')))
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await jobsApi.remove(job.id)
      toast.success(`${job.job_code} deleted.`)
      navigate('/jobs', { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the job.'))
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const back = (
    <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(listPath)}>
      {readOnly ? 'Back to assigned jobs' : 'Back to jobs'}
    </Button>
  )

  if (loadError || !job) {
    return (
      <div className="stack">
        <PageHeader title="Job" actions={back} />
        <div className="card card-body empty-state">{loadError || <span className="btn btn-ghost is-loading">Loading job…</span>}</div>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        title={`${job.job_code} · ${job.job_title}`}
        subtitle={`Created by ${job.created_by?.name ?? '—'} on ${formatDate(job.created_at)}`}
        actions={
          <>
            {back}
            {!readOnly && can('jobs.delete') && (
              <Button variant="secondary" icon={Trash2} onClick={() => setConfirmDelete(true)} style={{ color: 'var(--err)' }}>
                Delete
              </Button>
            )}
            {!readOnly && can('jobs.update') && (
              <Button icon={Pencil} onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                Edit job
              </Button>
            )}
          </>
        }
      />

      <div className="card card-body form-grid form-grid-3 job-view">
        {job.jd_file && (
          <Field label="JD file" wide>
            <span className="jd-file-chip">
              <FileText size={15} />
              <span title={job.jd_file.name}>{job.jd_file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                onClick={() => jobsApi.downloadJdFile(job.id, job.jd_file.name).catch(() => toast.error('Could not download the file.'))}
              >
                Download
              </Button>
            </span>
          </Field>
        )}

        <div className="view-field span-3">
          <span className="view-label">Job description</span>
          {job.job_description ? (
            // Already cleaned by the server; DOMPurify is a second safety net before using innerHTML.
            <div className="view-value is-rich rich-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.job_description) }} />
          ) : (
            <div className="view-value">
              <span className="muted">—</span>
            </div>
          )}
        </div>

        <Field label="Country">{job.country && `${job.country.name} (${job.country.code})`}</Field>
        <Field label="Client">
          {job.client && (
            <span className="entity-cell">
              {job.client.logo_url ? (
                <img className="entity-logo" src={job.client.logo_url} alt="" />
              ) : (
                <span className="entity-logo is-fallback" aria-hidden="true">{job.client.name.slice(0, 2).toUpperCase()}</span>
              )}
              {job.client.name}
            </span>
          )}
        </Field>
        <Field label="Client manager">{job.client_manager && `${job.client_manager.name}${job.client_manager.email ? ` · ${job.client_manager.email}` : ''}`}</Field>

        <Field label="Practice area">{job.practice_area && `${job.practice_area.name} (${job.practice_area.code})`}</Field>
        <Field label="Job title">{job.job_title}</Field>
        <Field label="Employment type">{job.employment_type && labelFor(EMPLOYMENT_TYPES, job.employment_type)}</Field>

        <Field label="Job type">
          <span className={`badge ${job.is_internal ? 'badge-primary' : 'badge-info'}`}>{labelFor(JOB_TYPES, job.is_internal ? 'internal' : 'external')}</span>
        </Field>
        <Field label="Priority">
          <span className={`badge ${PRIORITY_BADGE[job.priority] ?? 'badge-info'}`}>{labelFor(PRIORITIES, job.priority)}</span>
        </Field>
        <Field label="Work mode">{job.work_mode && labelFor(WORK_MODES, job.work_mode)}</Field>

        <Field label="Work location">{job.work_location}</Field>
        <Field label="Total experience">{years(job.total_experience)}</Field>
        <Field label="Relevant experience">{years(job.relevant_experience)}</Field>

        <Field label="Min budget">{formatMoney(job.budget_min, job.budget_currency_code)}</Field>
        <Field label="Max budget">{formatMoney(job.budget_max, job.budget_currency_code)}</Field>
        <Field label="Requirement date">{formatDate(job.requirement_date)}</Field>

        <Field label="No. of positions">
          {job.no_of_positions}
          <span className="muted"> ({job.positions_filled} filled)</span>
        </Field>
        <Field label="Contract duration">{job.contract_duration}</Field>
        <Field label="Status">
          <span className={statusBadgeClass(job.status)}>{job.status?.name}</span>
          {job.closed_at && <span className="muted"> · closed {formatDate(job.closed_at)}{job.closed_reason ? ` — ${job.closed_reason}` : ''}</span>}
        </Field>

        <Field label="Primary skills" wide>
          {job.primary_skills?.map((skill) => <span key={skill} className="tag">{skill}</span>)}
        </Field>
        <Field label="Secondary skills" wide>
          {job.secondary_skills?.map((skill) => <span key={skill} className="tag tag-muted">{skill}</span>)}
        </Field>
        <Field label="Recruiters" wide>
          {job.recruiters?.map((recruiter) => (
            <span key={recruiter.id} className={`tag ${recruiter.is_primary ? 'is-primary' : ''}`} title={recruiter.is_primary ? 'Primary recruiter' : undefined}>
              {recruiter.is_primary && <Star size={12} fill="currentColor" />}
              {recruiter.name}
            </span>
          ))}
        </Field>
        <Field label="Vendors" wide>
          {job.vendors?.map((vendor) => <span key={vendor.id} className="tag tag-muted">{vendor.name}</span>)}
        </Field>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete job?"
        message={`${job.job_code} · ${job.job_title} will be removed from all lists. Its job code is not reused.`}
        confirmLabel="Delete job"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  )
}
