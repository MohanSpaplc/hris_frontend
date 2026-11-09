import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, CheckCircle2, Download, FileText, Pencil, Trash2, UploadCloud, XCircle } from 'lucide-react'
import { candidatesApi, DOCUMENT_TYPES, extensionsFor, GENDERS, RESUME_SOURCES } from '../../api/candidates'
import { errorMessage, fieldErrors } from '../../api/client'
import { labelFor } from '../../api/jobs'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { statusBadgeClass } from '../../utils/status'
import { useCandidateLookups } from './useCandidateLookups'

const MAX_BYTES = 5 * 1024 * 1024

const formatDate = (value) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null
const formatMoney = (value, currency) =>
  value == null ? null : `${currency ?? ''} ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`.trim()
const formatSize = (bytes) => (bytes == null ? '' : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)
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

/** /candidates/:id */
export default function CandidateViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const lookups = useCandidateLookups()
  const [candidate, setCandidate] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentType, setDocumentType] = useState('resume')
  const [uploading, setUploading] = useState(false)
  const [busyDocumentId, setBusyDocumentId] = useState(null)
  const [deletingDocument, setDeletingDocument] = useState(null)
  const fileInputRef = useRef(null)
  const canEdit = can('candidates.update')

  useEffect(() => {
    let cancelled = false
    candidatesApi
      .get(id)
      .then((data) => !cancelled && setCandidate(data))
      .catch((error) => !cancelled && setLoadError(errorMessage(error, 'Could not load the candidate.')))
    return () => {
      cancelled = true
    }
  }, [id])

  const loadDocuments = useCallback(() => {
    setDocumentsLoading(true)
    return candidatesApi
      .documents(id)
      .then(setDocuments)
      .catch((error) => toast.error(errorMessage(error, 'Could not load the documents.')))
      .finally(() => setDocumentsLoading(false))
  }, [id])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await candidatesApi.remove(candidate.id)
      toast.success(`${candidate.candidate_code} deleted.`)
      navigate('/candidates', { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the candidate.'))
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleUpload = async (file) => {
    if (!file) return
    const extension = file.name.split('.').pop()?.toLowerCase()
    const allowed = extensionsFor(documentType)
    if (!allowed.includes(extension)) {
      toast.error(`Allowed file types for ${labelFor(DOCUMENT_TYPES, documentType)}: ${allowed.join(', ').toUpperCase()}.`)
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('The file must be 5 MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const document = await candidatesApi.uploadDocument(id, documentType, file)
      toast.success(`${labelFor(DOCUMENT_TYPES, documentType)} uploaded${document.version > 1 ? ` as version ${document.version}` : ''}.`)
      await loadDocuments()
    } catch (error) {
      toast.error(fieldErrors(error).file || errorMessage(error, 'Could not upload the file.'))
    } finally {
      setUploading(false)
    }
  }

  const setDocumentStatus = async (document, code) => {
    const status = lookups.documentStatuses.find((s) => s.code === code)
    if (!status) return
    setBusyDocumentId(document.id)
    try {
      const updated = await candidatesApi.setDocumentStatus(id, document.id, status.id)
      setDocuments((list) => list.map((d) => (d.id === updated.id ? updated : d)))
      toast.success(`${document.original_filename}: ${status.name}.`)
    } catch (error) {
      toast.error(errorMessage(error, 'Could not update the document.'))
    } finally {
      setBusyDocumentId(null)
    }
  }

  const handleDeleteDocument = async () => {
    setBusyDocumentId(deletingDocument.id)
    try {
      await candidatesApi.removeDocument(id, deletingDocument.id)
      toast.success(`${deletingDocument.original_filename} deleted.`)
      setDeletingDocument(null)
      await loadDocuments()
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete the document.'))
      setDeletingDocument(null)
    } finally {
      setBusyDocumentId(null)
    }
  }

  const back = (
    <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/candidates')}>
      Back to candidates
    </Button>
  )

  if (loadError || !candidate) {
    return (
      <div className="stack">
        <PageHeader title="Candidate" actions={back} />
        <div className="card card-body empty-state">{loadError || <span className="btn btn-ghost is-loading">Loading candidate…</span>}</div>
      </div>
    )
  }

  const skillsOf = (type) => candidate.skills?.filter((skill) => skill.skill_type === type) ?? []
  const skillTag = (skill, className) => (
    <span key={skill.id} className={`tag ${className}`}>
      {skill.name}
      {skill.experience_months ? <span className="muted"> · {Math.round((skill.experience_months / 12) * 10) / 10}y</span> : null}
    </span>
  )

  return (
    <div className="stack">
      <PageHeader
        title={`${candidate.candidate_code} · ${candidate.full_name}`}
        subtitle={`Added by ${candidate.created_by?.name ?? '—'} on ${formatDate(candidate.created_at)}`}
        actions={
          <>
            {back}
            {can('candidates.delete') && (
              <Button variant="secondary" icon={Trash2} onClick={() => setConfirmDelete(true)} style={{ color: 'var(--err)' }}>
                Delete
              </Button>
            )}
            {canEdit && (
              <Button icon={Pencil} onClick={() => navigate(`/candidates/${candidate.id}/edit`)}>
                Edit candidate
              </Button>
            )}
          </>
        }
      />

      <div className="card card-body form-grid form-grid-3 job-view">
        {candidate.applications?.length > 0 && (
          <Field label="Tagged jobs" wide>
            {candidate.applications.map((application) => (
              <span key={application.id} className="tag tag-muted" title={application.status?.name}>
                <a className="job-link" href={`/jobs/${application.job?.id}`} onClick={(e) => (e.preventDefault(), navigate(`/jobs/${application.job?.id}`))}>
                  {application.job?.job_code} · {application.job?.job_title}
                </a>
                <span className="muted"> · {application.stage?.name}</span>
              </span>
            ))}
          </Field>
        )}

        <div className="form-section">Personal details</div>
        <Field label="Full name">{candidate.full_name}</Field>
        <Field label="Gender">{candidate.gender && labelFor(GENDERS, candidate.gender)}</Field>
        <Field label="Status">
          <span className={statusBadgeClass(candidate.status)}>{candidate.status?.name}</span>
        </Field>
        <Field label="Email">{candidate.email && <a href={`mailto:${candidate.email}`}>{candidate.email}</a>}</Field>
        <Field label="Phone">{candidate.phone && <a href={`tel:${candidate.phone.replace(/[^\d+]/g, '')}`}>{candidate.phone}</a>}</Field>
        <Field label="Current location">{candidate.current_location}</Field>

        <div className="form-section">Professional details</div>
        <Field label="Current designation">{candidate.current_designation}</Field>
        <Field label="Current company">{candidate.current_company}</Field>
        <Field label="Preferred location">{candidate.preferred_location}</Field>
        <Field label="Total experience">{years(candidate.total_experience)}</Field>
        <Field label="Relevant experience">{years(candidate.relevant_experience)}</Field>
        <Field label="Notice period">{candidate.notice_period_days != null && `${candidate.notice_period_days} days`}</Field>
        <Field label="Current CTC">{formatMoney(candidate.current_ctc, candidate.ctc_currency_code)}</Field>
        <Field label="Expected CTC">{formatMoney(candidate.expected_ctc, candidate.ctc_currency_code)}</Field>
        <Field label="Resume source">
          {candidate.resume_source && labelFor(RESUME_SOURCES, candidate.resume_source)}
          {candidate.vendor && <span className="muted"> · {candidate.vendor.name}</span>}
          {candidate.referral_name && <span className="muted"> · {candidate.referral_name}</span>}
        </Field>

        <div className="form-section">Skills</div>
        <Field label="Primary skills" wide>{skillsOf('primary').map((skill) => skillTag(skill, ''))}</Field>
        <Field label="Secondary skills" wide>{skillsOf('secondary').map((skill) => skillTag(skill, 'tag-muted'))}</Field>
        {skillsOf('other').length > 0 && <Field label="Other skills" wide>{skillsOf('other').map((skill) => skillTag(skill, 'tag-muted'))}</Field>}

        <Field label="Education" wide>
          {candidate.education_details && <span style={{ whiteSpace: 'pre-line' }}>{candidate.education_details}</span>}
        </Field>
      </div>

      <div className="card">
        <div className="filter-bar">
          <b style={{ marginRight: 'auto' }}>Documents</b>
          {canEdit && (
            <>
              <select className="input" value={documentType} onChange={(e) => setDocumentType(e.target.value)} aria-label="Document type" style={{ width: 170 }}>
                {DOCUMENT_TYPES.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept={extensionsFor(documentType).map((type) => `.${type}`).join(',')}
                onChange={(e) => {
                  handleUpload(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <Button icon={UploadCloud} loading={uploading} onClick={() => fileInputRef.current?.click()}>
                Upload
              </Button>
            </>
          )}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Version</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th style={{ width: 160, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentsLoading && !documents.length && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <span className="btn btn-ghost is-loading">Loading documents…</span>
                  </td>
                </tr>
              )}
              {!documentsLoading && !documents.length && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <FileText size={28} style={{ marginBottom: 6 }} />
                    <div>No documents yet.</div>
                  </td>
                </tr>
              )}
              {documents.map((document) => {
                const busy = busyDocumentId === document.id
                return (
                  <tr key={document.id} style={{ opacity: document.is_current ? 1 : 0.6 }}>
                    <td>
                      <span className="entity-cell">
                        <FileText size={15} />
                        <span title={document.original_filename}>{document.original_filename}</span>
                      </span>
                      <div className="muted" style={{ fontSize: 12 }}>{formatSize(document.file_size_bytes)}</div>
                    </td>
                    <td>{labelFor(DOCUMENT_TYPES, document.document_type)}</td>
                    <td>
                      v{document.version}
                      {!document.is_current && <span className="muted"> (old)</span>}
                    </td>
                    <td>
                      {formatDate(document.created_at)}
                      <div className="muted" style={{ fontSize: 12 }}>{document.uploaded_by?.name}</div>
                    </td>
                    <td>
                      <span className={statusBadgeClass(document.status)}>{document.status?.name}</span>
                      {document.verified_by && <div className="muted" style={{ fontSize: 12 }}>by {document.verified_by.name}</div>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Download}
                          onClick={() => candidatesApi.downloadDocument(id, document).catch(() => toast.error('Could not download the file.'))}
                          aria-label={`Download ${document.original_filename}`}
                          title="Download"
                        />
                        {canEdit && document.status?.code !== 'verified' && (
                          <Button variant="ghost" size="sm" icon={CheckCircle2} disabled={busy} onClick={() => setDocumentStatus(document, 'verified')} aria-label="Mark verified" title="Verify" style={{ color: 'var(--ok)' }} />
                        )}
                        {canEdit && document.status?.code !== 'rejected' && (
                          <Button variant="ghost" size="sm" icon={XCircle} disabled={busy} onClick={() => setDocumentStatus(document, 'rejected')} aria-label="Mark rejected" title="Reject" style={{ color: 'var(--warn)' }} />
                        )}
                        {canEdit && (
                          <Button variant="ghost" size="sm" icon={Trash2} disabled={busy} onClick={() => setDeletingDocument(document)} aria-label={`Delete ${document.original_filename}`} title="Delete" style={{ color: 'var(--err)' }} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete candidate?"
        message={`${candidate.candidate_code} · ${candidate.full_name} will be removed from all lists. Their documents are kept.`}
        confirmLabel="Delete candidate"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={Boolean(deletingDocument)}
        title="Delete document?"
        message={`${deletingDocument?.original_filename} will be deleted permanently.${deletingDocument?.is_current && deletingDocument?.version > 1 ? ' The previous version becomes current again.' : ''}`}
        confirmLabel="Delete document"
        loading={Boolean(deletingDocument) && busyDocumentId === deletingDocument?.id}
        onConfirm={handleDeleteDocument}
        onClose={() => setDeletingDocument(null)}
      />
    </div>
  )
}
