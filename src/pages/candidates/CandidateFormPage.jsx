import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Save } from 'lucide-react'
import { candidatesApi, DOCUMENT_EXTENSIONS, GENDERS, RESUME_SOURCES } from '../../api/candidates'
import { errorMessage, fieldErrors } from '../../api/client'
import { jobsApi, skillsApi } from '../../api/jobs'
import Button from '../../components/Button'
import { FloatingInput, FloatingSelect } from '../../components/FloatingField'
import JdUpload from '../../components/JdUpload'
import PageHeader from '../../components/PageHeader'
import SearchSelect from '../../components/SearchSelect'
import TagInput from '../../components/TagInput'
import { useCandidateLookups } from './useCandidateLookups'

const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value))
const text = (value) => String(value ?? '').trim() || null

const skillNames = (candidate, type) => candidate?.skills?.filter((skill) => skill.skill_type === type).map((skill) => skill.name) ?? []

const toForm = (candidate) => ({
  first_name: candidate?.first_name ?? '',
  last_name: candidate?.last_name ?? '',
  email: candidate?.email ?? '',
  phone: candidate?.phone ?? '',
  gender: candidate?.gender ?? '',
  current_designation: candidate?.current_designation ?? '',
  current_company: candidate?.current_company ?? '',
  current_location: candidate?.current_location ?? '',
  preferred_location: candidate?.preferred_location ?? '',
  total_experience: candidate?.total_experience ?? '',
  relevant_experience: candidate?.relevant_experience ?? '',
  notice_period_days: candidate?.notice_period_days ?? '',
  current_ctc: candidate?.current_ctc ?? '',
  expected_ctc: candidate?.expected_ctc ?? '',
  job_id: '',
  resume_source: candidate?.resume_source ?? '',
  vendor_id: candidate?.vendor?.id ?? '',
  referral_name: candidate?.referral_name ?? '',
  primary_skills: skillNames(candidate, 'primary'),
  secondary_skills: skillNames(candidate, 'secondary'),
  other_skills: skillNames(candidate, 'other'),
  education_details: candidate?.education_details ?? '',
  status_id: candidate?.status?.id ?? '',
})

function validate(form) {
  const errors = {}
  const total = numberOrNull(form.total_experience)
  const relevant = numberOrNull(form.relevant_experience)

  if (!form.first_name.trim()) errors.first_name = 'Enter the first name.'
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email.'
  if (form.phone && !/^\+?[0-9 ()-]{6,30}$/.test(form.phone.trim())) errors.phone = 'Digits, spaces, + ( ) - only.'
  if (total !== null && (total < 0 || total > 60)) errors.total_experience = 'Enter 0–60 years.'
  if (relevant !== null && total !== null && relevant > total) errors.relevant_experience = 'Cannot be more than total experience.'
  if (form.resume_source === 'vendor' && !form.vendor_id) errors.vendor_id = 'Select the vendor.'
  if (form.resume_source === 'referral' && !form.referral_name.trim()) errors.referral_name = 'Enter who referred them.'
  return errors
}

/** /candidates/new and /candidates/:id/edit */
export default function CandidateFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const lookups = useCandidateLookups()

  const [candidate, setCandidate] = useState(null)
  const [form, setForm] = useState(() => toForm(null))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  // A newly chosen resume is read to fill the form, then uploaded after saving (as the next version).
  const [resumeFile, setResumeFile] = useState(null)
  const [readingResume, setReadingResume] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [openJobs, setOpenJobs] = useState([])

  // Jobs a candidate can be tagged to: open or on hold.
  useEffect(() => {
    let cancelled = false
    jobsApi
      .list({ per_page: 100, sort: 'title' })
      .then((data) => !cancelled && setOpenJobs(data.data.filter((job) => ['open', 'on_hold'].includes(job.status?.code))))
      .catch(() => !cancelled && setOpenJobs([]))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isEdit) return undefined
    let cancelled = false
    candidatesApi
      .get(id)
      .then((data) => {
        if (cancelled) return
        setCandidate(data)
        setForm(toForm(data))
      })
      .catch((error) => !cancelled && setLoadError(errorMessage(error, 'Could not load the candidate.')))
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const update = (field) => (event) => set(field, event.target.value)


  /** Read the resume on the server and fill every field it could find. */
  const handleResumeFile = async (file) => {
    setReadingResume(true)
    setResumeError('')
    try {
      const { fields } = await candidatesApi.parseResume(file)
      const sameSkill = (a, b) => a.toLowerCase() === b.toLowerCase()
      const merge = (current, found = []) => [...current, ...found.filter((skill) => !current.some((c) => sameSkill(c, skill)))]
      const simpleFields = [
        'first_name', 'last_name', 'email', 'phone', 'gender', 'current_location', 'current_designation', 'current_company',
        'preferred_location', 'total_experience', 'relevant_experience', 'current_ctc', 'expected_ctc', 'notice_period_days',
      ]
      const updates = Object.fromEntries(simpleFields.filter((field) => fields[field] !== undefined && fields[field] !== null).map((field) => [field, fields[field]]))

      setForm((f) => {
        const primary = merge(f.primary_skills, fields.primary_skills)
        const secondary = merge(f.secondary_skills, fields.secondary_skills).filter((skill) => !primary.some((p) => sameSkill(p, skill)))
        return { ...f, ...updates, primary_skills: primary, secondary_skills: secondary, education_details: fields.education_details ?? f.education_details }
      })
      setErrors({})
      setResumeFile(file)

      const filledCount = Object.keys(updates).length + (fields.primary_skills?.length || fields.secondary_skills?.length ? 1 : 0) + (fields.education_details ? 1 : 0)
      if (filledCount) toast.success(`Resume read: ${filledCount} field${filledCount === 1 ? '' : 's'} filled. Please check them before saving.`)
      else toast.info('Resume attached. No fields could be read from it; please fill the form.')
    } catch (error) {
      setResumeError(fieldErrors(error).file || errorMessage(error, 'Could not read this file.'))
    } finally {
      setReadingResume(false)
    }
  }

  // Jobs already tagged are not offered again.
  const taggedJobIds = candidate?.applications?.map((application) => application.job?.id) ?? []
  const jobOptions = openJobs
    .filter((job) => !taggedJobIds.includes(job.id))
    .map((job) => ({ value: job.id, label: `${job.job_code} · ${job.job_title}${job.client ? ` (${job.client.name})` : ''}` }))

  const backTo = isEdit ? `/candidates/${id}` : '/candidates'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientErrors = validate(form)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    // Keep the saved experience months of skills that are still listed.
    const months = Object.fromEntries((candidate?.skills ?? []).map((skill) => [skill.name.toLowerCase(), skill.experience_months]))
    const skills = ['primary', 'secondary', 'other'].flatMap((type) =>
      form[`${type}_skills`].map((name) => ({ name, skill_type: type, experience_months: months[name.toLowerCase()] ?? null })),
    )
    const payload = {
      first_name: form.first_name.trim(),
      last_name: text(form.last_name),
      email: text(form.email),
      phone: text(form.phone),
      gender: form.gender || null,
      current_designation: text(form.current_designation),
      current_company: text(form.current_company),
      current_location: text(form.current_location),
      preferred_location: text(form.preferred_location),
      total_experience: numberOrNull(form.total_experience),
      relevant_experience: numberOrNull(form.relevant_experience),
      notice_period_days: numberOrNull(form.notice_period_days),
      current_ctc: numberOrNull(form.current_ctc),
      expected_ctc: numberOrNull(form.expected_ctc),
      job_id: form.job_id ? Number(form.job_id) : null,
      resume_source: form.resume_source || null,
      vendor_id: form.resume_source === 'vendor' ? Number(form.vendor_id) : null,
      referral_name: form.resume_source === 'referral' ? text(form.referral_name) : null,
      skills,
      education_details: text(form.education_details),
    }
    if (form.status_id) payload.status_id = Number(form.status_id)

    setSaving(true)
    try {
      const saved = isEdit ? await candidatesApi.update(id, payload) : await candidatesApi.create(payload)
      toast.success(isEdit ? `${saved.candidate_code} updated.` : `Candidate ${saved.candidate_code} added.`)

      // The candidate is saved; a file problem is reported but does not undo it.
      if (resumeFile) {
        try {
          await candidatesApi.uploadDocument(saved.id, 'resume', resumeFile)
        } catch (fileError) {
          toast.warning(`Candidate saved, but the resume was not uploaded: ${fieldErrors(fileError).file || errorMessage(fileError)}`)
        }
      }
      navigate(`/candidates/${saved.id}`, { replace: true })
    } catch (error) {
      const serverErrors = fieldErrors(error)
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors)
        toast.error('Please fix the highlighted fields.')
      } else {
        toast.error(errorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const pairs = (list) =>
    list.map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))
  // Keep the saved vendor selectable even if it is no longer active.
  const vendorOptions = [
    ...(candidate?.vendor && !lookups.vendors.some((v) => v.id === candidate.vendor.id) ? [candidate.vendor] : []),
    ...lookups.vendors,
  ].map((vendor) => ({ value: vendor.id, label: vendor.name }))

  const savedResume = candidate?.resume

  if (loadError) {
    return (
      <div className="stack">
        <PageHeader title="Edit candidate" actions={<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/candidates')}>Back to candidates</Button>} />
        <div className="card card-body empty-state">{loadError}</div>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        title={isEdit ? `Edit candidate${candidate ? ` · ${candidate.candidate_code}` : ''}` : 'Add candidate'}
        subtitle={isEdit ? candidate?.full_name : 'The candidate code is generated when you save, e.g. CAN-00001.'}
        actions={
          <>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(backTo)} disabled={saving}>
              Back
            </Button>
            <Button type="submit" form="candidate-form" icon={Save} loading={saving} disabled={isEdit && !candidate}>
              {isEdit ? 'Save changes' : 'Add candidate'}
            </Button>
          </>
        }
      />

      {isEdit && !candidate ? (
        <div className="card card-body empty-state">
          <span className="btn btn-ghost is-loading">Loading candidate…</span>
        </div>
      ) : (
        <form id="candidate-form" className="card card-body form-grid-12 job-form" onSubmit={handleSubmit} noValidate>
          <div className="col-6">
            <SearchSelect
              label={isEdit ? 'Tag to another job (optional)' : 'Job (optional)'}
              value={form.job_id}
              onChange={update('job_id')}
              error={errors.job_id}
              options={jobOptions}
              placeholder="Search job code or title…"
              hint={
                errors.job_id
                  ? undefined
                  : candidate?.applications?.length
                    ? `Already tagged: ${candidate.applications.map((application) => application.job?.job_code).join(', ')}`
                    : 'Open and on-hold jobs. The candidate is added to it at stage Submitted.'
              }
            />
          </div>
          <div className="col-6">
            <JdUpload
              label={savedResume ? `Resume (current: v${savedResume.version})` : 'Resume (optional)'}
              description={savedResume && !resumeFile ? 'A new file is read and saved as the next version' : 'Fills the form automatically'}
              allowed={DOCUMENT_EXTENSIONS.resume}
              fileName={resumeFile?.name ?? savedResume?.original_filename}
              reading={readingResume}
              error={resumeError}
              onFile={handleResumeFile}
              onDownload={!resumeFile && savedResume ? () => candidatesApi.downloadDocument(id, savedResume).catch(() => toast.error('Could not download the file.')) : undefined}
              onRemove={resumeFile ? () => setResumeFile(null) : undefined}
            />
          </div>

          {/* Row: 4 per row */}
          <div className="col-3">
            <FloatingInput label="First name" required maxLength={100} value={form.first_name} onChange={update('first_name')} error={errors.first_name} />
          </div>
          <div className="col-3">
            <FloatingInput label="Last name" maxLength={100} value={form.last_name} onChange={update('last_name')} error={errors.last_name} />
          </div>
          <div className="col-3">
            <FloatingInput label="Email" type="email" maxLength={255} value={form.email} onChange={update('email')} error={errors.email} />
          </div>
          <div className="col-3">
            <FloatingInput label="Phone" type="tel" maxLength={30} value={form.phone} onChange={update('phone')} error={errors.phone} />
          </div>

          <div className="col-3">
            <FloatingSelect label="Gender" value={form.gender} onChange={update('gender')} error={errors.gender}>
              {pairs(GENDERS)}
            </FloatingSelect>
          </div>
          <div className="col-3">
            <FloatingInput label="Current location" maxLength={200} value={form.current_location} onChange={update('current_location')} error={errors.current_location} />
          </div>
          <div className="col-3">
            <FloatingInput label="Current designation" maxLength={200} value={form.current_designation} onChange={update('current_designation')} error={errors.current_designation} />
          </div>
          <div className="col-3">
            <FloatingInput label="Current company" maxLength={200} value={form.current_company} onChange={update('current_company')} error={errors.current_company} />
          </div>

          <div className="col-3">
            <FloatingInput label="Preferred location" maxLength={200} value={form.preferred_location} onChange={update('preferred_location')} error={errors.preferred_location} />
          </div>
          <div className="col-3">
            <FloatingInput label="Total experience (years)" type="number" min={0} max={60} step={0.5} value={form.total_experience} onChange={update('total_experience')} error={errors.total_experience} />
          </div>
          <div className="col-3">
            <FloatingInput label="Relevant experience (years)" type="number" min={0} max={60} step={0.5} value={form.relevant_experience} onChange={update('relevant_experience')} error={errors.relevant_experience} />
          </div>
          <div className="col-3">
            <FloatingInput label="Current CTC" type="number" min={0} value={form.current_ctc} onChange={update('current_ctc')} error={errors.current_ctc} />
          </div>

          <div className="col-3">
            <FloatingInput label="Expected CTC" type="number" min={0} value={form.expected_ctc} onChange={update('expected_ctc')} error={errors.expected_ctc} />
          </div>
          <div className="col-3">
            <FloatingInput label="Notice period (days)" type="number" min={0} max={365} value={form.notice_period_days} onChange={update('notice_period_days')} error={errors.notice_period_days} />
          </div>
          <div className="col-3">
            <FloatingSelect label="Resume source" value={form.resume_source} onChange={update('resume_source')} error={errors.resume_source}>
              {pairs(RESUME_SOURCES)}
            </FloatingSelect>
          </div>
          <div className="col-3">
            <FloatingSelect label="Status" value={form.status_id} onChange={update('status_id')} error={errors.status_id} hint={isEdit ? undefined : 'Leave empty to start as Active'}>
              {lookups.candidateStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </FloatingSelect>
          </div>

          {form.resume_source === 'vendor' && (
            <div className="col-6">
              <SearchSelect label="Vendor" required value={form.vendor_id} onChange={update('vendor_id')} error={errors.vendor_id} options={vendorOptions} />
            </div>
          )}
          {form.resume_source === 'referral' && (
            <div className="col-6">
              <FloatingInput label="Referred by" required maxLength={200} value={form.referral_name} onChange={update('referral_name')} error={errors.referral_name} />
            </div>
          )}

          {/* Row: 2 per row */}
          <div className="col-6">
            <TagInput label="Primary skills" value={form.primary_skills} onChange={(v) => set('primary_skills', v)} fetchSuggestions={skillsApi.search} error={errors.skills} hint={errors.skills ? undefined : 'Type a skill and press Enter'} />
          </div>
          <div className="col-6">
            <TagInput label="Secondary skills" value={form.secondary_skills} onChange={(v) => set('secondary_skills', v)} fetchSuggestions={skillsApi.search} />
          </div>

          <div className="col-3">
            <FloatingInput label="Education" maxLength={200} value={form.education_details} onChange={update('education_details')} error={errors.education_details} />
          </div>

          <div className="col-12 form-actions">
            <Button variant="secondary" onClick={() => navigate(backTo)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} loading={saving}>
              {isEdit ? 'Save changes' : 'Add candidate'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
