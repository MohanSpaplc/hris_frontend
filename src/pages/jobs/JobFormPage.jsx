import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Save } from 'lucide-react'
import { clientManagersApi } from '../../api/clients'
import { errorMessage, fieldErrors } from '../../api/client'
import { EMPLOYMENT_TYPES, jobsApi, JOB_TYPES, PRIORITIES, skillsApi, WORK_MODES } from '../../api/jobs'
import Button from '../../components/Button'
import { FloatingDate, FloatingInput, FloatingSelect } from '../../components/FloatingField'
import JdUpload from '../../components/JdUpload'
import MultiSelect from '../../components/MultiSelect'
import PageHeader from '../../components/PageHeader'
import RichTextEditor from '../../components/RichTextEditor'
import SearchSelect from '../../components/SearchSelect'
import TagInput from '../../components/TagInput'
import { useJobLookups } from './useJobLookups'

// "2026-11-15" <-> local Date (avoids the UTC shift of new Date("2026-11-15")).
const toDate = (value) => (value ? new Date(`${value}T00:00:00`) : null)
const toDateString = (date) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null
// Keep the record's current value selectable even if it is no longer active.
const withCurrent = (list, current) => (current && !list.some((item) => item.id === current.id) ? [current, ...list] : list)
const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value))

const toForm = (job) => ({
  job_description: job?.job_description ?? '',
  country_id: job?.country?.id ?? '',
  client_id: job?.client?.id ?? '',
  client_manager_id: job?.client_manager?.id ?? '',
  practice_area_id: job?.practice_area?.id ?? '',
  job_title: job?.job_title ?? '',
  employment_type: job?.employment_type ?? '',
  job_type: job?.is_internal ? 'internal' : 'external',
  priority: job?.priority ?? 'medium',
  work_mode: job?.work_mode ?? '',
  work_location: job?.work_location ?? '',
  total_experience: job?.total_experience ?? '',
  relevant_experience: job?.relevant_experience ?? '',
  budget_min: job?.budget_min ?? '',
  budget_max: job?.budget_max ?? '',
  requirement_date: toDate(job?.requirement_date),
  no_of_positions: job?.no_of_positions ?? 1,
  contract_duration: job?.contract_duration ?? '',
  primary_skills: job?.primary_skills ?? [],
  secondary_skills: job?.secondary_skills ?? [],
  recruiter_ids: job?.recruiters?.map((r) => r.id) ?? [],
  primary_recruiter_id: job?.recruiters?.find((r) => r.is_primary)?.id ?? null,
  vendor_ids: job?.vendors?.map((v) => v.id) ?? [],
  status_id: job?.status?.id ?? '',
  closed_reason: job?.closed_reason ?? '',
})

function validate(form) {
  const errors = {}
  const total = numberOrNull(form.total_experience)
  const relevant = numberOrNull(form.relevant_experience)
  const min = numberOrNull(form.budget_min)
  const max = numberOrNull(form.budget_max)

  if (!form.country_id) errors.country_id = 'Select a country.'
  if (form.job_type === 'external' && !form.client_id) errors.client_id = 'Select a client, or set Job type to Internal.'
  if (!form.practice_area_id) errors.practice_area_id = 'Select a practice area.'
  if (!form.job_title.trim()) errors.job_title = 'Enter the job title.'
  if (total !== null && (total < 0 || total > 60)) errors.total_experience = 'Enter 0–60 years.'
  if (relevant !== null && total !== null && relevant > total) errors.relevant_experience = 'Cannot be more than total experience.'
  if (min !== null && max !== null && max < min) errors.budget_max = 'Must be ≥ min budget.'
  if (!Number.isInteger(Number(form.no_of_positions)) || Number(form.no_of_positions) < 1) errors.no_of_positions = 'At least 1.'
  const overlap = form.primary_skills.filter((s) => form.secondary_skills.some((t) => t.toLowerCase() === s.toLowerCase()))
  if (overlap.length) errors.secondary_skills = `Already a primary skill: ${overlap.join(', ')}.`
  return errors
}

/** /jobs/new and /jobs/:id/edit */
export default function JobFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const lookups = useJobLookups()

  const [job, setJob] = useState(null)
  const [form, setForm] = useState(() => toForm(null))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [managers, setManagers] = useState([])
  const [loadError, setLoadError] = useState('')
  // JD file: a newly chosen file is attached after saving; the saved one can be downloaded or removed.
  const [jdFile, setJdFile] = useState(null)
  const [savedJdName, setSavedJdName] = useState(null)
  const [jdRemoved, setJdRemoved] = useState(false)
  const [readingJd, setReadingJd] = useState(false)
  const [jdError, setJdError] = useState('')
  const [editorKey, setEditorKey] = useState(0) // bump to load new content into the editor

  // Edit: load the job, then fill the form.
  useEffect(() => {
    if (!isEdit) return undefined
    let cancelled = false
    jobsApi
      .get(id)
      .then((data) => {
        if (cancelled) return
        setJob(data)
        setSavedJdName(data.jd_file?.name ?? null)
        setForm(toForm(data))
      })
      .catch((error) => !cancelled && setLoadError(errorMessage(error, 'Could not load the job.')))
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  // Managers of the selected client.
  useEffect(() => {
    if (form.job_type !== 'external' || !form.client_id) return undefined
    let cancelled = false
    clientManagersApi
      .list({ client_id: form.client_id, per_page: 100, sort: 'name' })
      .then((data) => !cancelled && setManagers(data.data))
      .catch(() => !cancelled && setManagers([]))
    return () => {
      cancelled = true
    }
  }, [form.job_type, form.client_id])

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const update = (field) => (event) => set(field, event.target.value)

  const changeCountry = update('country_id')

  // Client fills its country and clears the old manager.
  const changeClient = (event) => {
    const client = lookups.clients.find((c) => String(c.id) === event.target.value)
    setForm((f) => ({ ...f, client_id: event.target.value, client_manager_id: '', country_id: client?.country?.id ?? f.country_id }))
    setErrors((e) => ({ ...e, client_id: undefined, country_id: undefined }))
  }

  // Internal jobs have no client or client manager.
  const changeJobType = (event) => {
    const jobType = event.target.value
    setForm((f) => ({ ...f, job_type: jobType, ...(jobType === 'internal' ? { client_id: '', client_manager_id: '' } : {}) }))
    setErrors((e) => ({ ...e, client_id: undefined, client_manager_id: undefined }))
  }

  /** Read the JD on the server and fill every field it could match. */
  const handleJdFile = async (file) => {
    setReadingJd(true)
    setJdError('')
    try {
      const { job_description: description, fields } = await jobsApi.parseJd(file)
      const known = (list, value) => (value && list.some((item) => item.id === value) ? value : undefined)
      const sameSkill = (a, b) => a.toLowerCase() === b.toLowerCase()
      const merge = (current, found = []) => [...current, ...found.filter((skill) => !current.some((c) => sameSkill(c, skill)))]
      const clientId = known(lookups.clients, fields.client_id)
      const client = lookups.clients.find((c) => c.id === clientId)

      const updates = Object.fromEntries(
        Object.entries({
          job_title: fields.job_title,
          total_experience: fields.total_experience,
          relevant_experience: fields.relevant_experience,
          work_location: fields.work_location,
          work_mode: fields.work_mode,
          employment_type: fields.employment_type,
          no_of_positions: fields.no_of_positions,
          contract_duration: fields.contract_duration,
          budget_min: fields.budget_min,
          budget_max: fields.budget_max,
          practice_area_id: known(lookups.practiceAreas, fields.practice_area_id),
          country_id: known(lookups.countries, fields.country_id) ?? client?.country?.id,
          ...(clientId ? { job_type: 'external', client_id: clientId, client_manager_id: '' } : {}),
        }).filter(([, value]) => value !== undefined && value !== null && value !== ''),
      )

      setForm((f) => {
        const primary = merge(f.primary_skills, fields.primary_skills)
        const secondary = merge(f.secondary_skills, fields.secondary_skills).filter((skill) => !primary.some((p) => sameSkill(p, skill)))
        return { ...f, ...updates, job_description: description ?? f.job_description, primary_skills: primary, secondary_skills: secondary }
      })
      setErrors({})
      setEditorKey((k) => k + 1)
      setJdFile(file)
      setJdRemoved(false)

      const filledCount = Object.keys(updates).length + (fields.primary_skills?.length || fields.secondary_skills?.length ? 1 : 0)
      toast.success(
        filledCount
          ? `JD read: description and ${filledCount} field${filledCount === 1 ? '' : 's'} filled. Please check them before saving.`
          : 'JD read: description filled. No other fields could be matched.',
      )
    } catch (error) {
      setJdError(fieldErrors(error).file || errorMessage(error, 'Could not read this file.'))
    } finally {
      setReadingJd(false)
    }
  }

  const selectedStatus = lookups.jobStatuses.find((s) => String(s.id) === String(form.status_id))
  const backTo = isEdit ? `/jobs/${id}` : '/jobs'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientErrors = validate(form)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    const isInternal = form.job_type === 'internal'
    const text = (value) => String(value ?? '').trim() || null
    const payload = {
      job_description: text(form.job_description),
      country_id: Number(form.country_id),
      client_id: isInternal ? null : Number(form.client_id),
      client_manager_id: isInternal || !form.client_manager_id || form.client_manager_id === 'none' ? null : Number(form.client_manager_id),
      practice_area_id: Number(form.practice_area_id),
      job_title: form.job_title.trim(),
      employment_type: form.employment_type || null,
      priority: form.priority,
      work_mode: form.work_mode || null,
      work_location: text(form.work_location),
      total_experience: numberOrNull(form.total_experience),
      relevant_experience: numberOrNull(form.relevant_experience),
      budget_min: numberOrNull(form.budget_min),
      budget_max: numberOrNull(form.budget_max),
      requirement_date: toDateString(form.requirement_date),
      no_of_positions: Number(form.no_of_positions),
      contract_duration: text(form.contract_duration),
      primary_skills: form.primary_skills,
      secondary_skills: form.secondary_skills,
      recruiter_ids: form.recruiter_ids,
      primary_recruiter_id: form.primary_recruiter_id,
      vendor_ids: form.vendor_ids,
    }
    if (form.status_id) payload.status_id = Number(form.status_id)
    if (selectedStatus?.is_final) payload.closed_reason = text(form.closed_reason)

    setSaving(true)
    try {
      const saved = isEdit ? await jobsApi.update(id, payload) : await jobsApi.create(payload)
      toast.success(isEdit ? `${saved.job_code} updated.` : `Job ${saved.job_code} created.`)

      // The job is saved; a file problem is reported but does not undo it.
      try {
        if (jdFile) await jobsApi.uploadJdFile(saved.id, jdFile)
        else if (jdRemoved && savedJdName) await jobsApi.removeJdFile(saved.id)
      } catch (fileError) {
        toast.warning(`Job saved, but the JD file was not updated: ${fieldErrors(fileError).file || errorMessage(fileError)}`)
      }
      navigate(`/jobs/${saved.id}`, { replace: true })
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

  const options = (list, labelOf = (item) => item.name) =>
    list.map((item) => (
      <option key={item.id} value={item.id}>
        {labelOf(item)}
      </option>
    ))
  const searchOptions = (list) => list.map((item) => ({ value: item.id, label: item.name }))
  const pairs = (list) =>
    list.map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))

  const headerActions = (
    <>
      <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(backTo)} disabled={saving}>
        Back
      </Button>
      <Button type="submit" form="job-form" icon={Save} loading={saving} disabled={isEdit && !job}>
        {isEdit ? 'Save changes' : 'Create job'}
      </Button>
    </>
  )

  if (loadError) {
    return (
      <div className="stack">
        <PageHeader title="Edit job" actions={<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/jobs')}>Back to jobs</Button>} />
        <div className="card card-body empty-state">{loadError}</div>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        title={isEdit ? `Edit job${job ? ` · ${job.job_code}` : ''}` : 'Create job'}
        subtitle={isEdit ? job?.job_title : 'The job code is generated when you save, e.g. IND-JAVA-00001.'}
        actions={headerActions}
      />

      {isEdit && !job ? (
        <div className="card card-body empty-state">
          <span className="btn btn-ghost is-loading">Loading job…</span>
        </div>
      ) : (
        <form id="job-form" className="card card-body form-grid-12 job-form" onSubmit={handleSubmit} noValidate>
          <div className="col-12">
            <JdUpload
              fileName={jdFile?.name ?? (jdRemoved ? null : savedJdName)}
              reading={readingJd}
              error={jdError}
              onFile={handleJdFile}
              onDownload={
                !jdFile && savedJdName && !jdRemoved
                  ? () => jobsApi.downloadJdFile(id, savedJdName).catch(() => toast.error('Could not download the file.'))
                  : undefined
              }
              onRemove={() => {
                setJdFile(null)
                setJdRemoved(true)
              }}
            />
          </div>

          <div className="col-12">
            <RichTextEditor
              key={editorKey}
              label="Job description"
              value={form.job_description}
              onChange={(html) => set('job_description', html)}
              error={errors.job_description}
              placeholder="Describe the role, responsibilities and requirements, or upload a JD above."
            />
          </div>

          <SearchSelect
            label="Country"
            required
            value={form.country_id}
            onChange={changeCountry}
            error={errors.country_id}
            options={searchOptions(withCurrent(lookups.countries, job?.country))}
          />
          <SearchSelect
            label="Client"
            required={form.job_type === 'external'}
            value={form.client_id}
            onChange={changeClient}
            error={errors.client_id}
            disabled={form.job_type === 'internal'}
            hint={form.job_type === 'internal' ? 'Not needed for internal jobs' : undefined}
            options={searchOptions(withCurrent(lookups.clients, job?.client))}
          />
          <FloatingSelect
            label="Client manager"
            value={form.client_manager_id}
            onChange={update('client_manager_id')}
            error={errors.client_manager_id}
            disabled={form.job_type === 'internal' || !form.client_id}
            hint={form.job_type === 'external' && form.client_id && managers.length === 0 ? 'This client has no managers yet' : undefined}
          >
            <option value="none">— None —</option>
            {options(managers)}
          </FloatingSelect>

          <FloatingSelect label="Practice area" required value={form.practice_area_id} onChange={update('practice_area_id')} error={errors.practice_area_id}>
            {options(withCurrent(lookups.practiceAreas, job?.practice_area), (p) => `${p.name} (${p.code})`)}
          </FloatingSelect>
          <FloatingInput label="Job title" required maxLength={200} value={form.job_title} onChange={update('job_title')} error={errors.job_title} />
          <FloatingSelect label="Employment type" value={form.employment_type} onChange={update('employment_type')} error={errors.employment_type}>
            {pairs(EMPLOYMENT_TYPES)}
          </FloatingSelect>

          {/* Row: 4 per row */}
          <div className="col-3">
            <FloatingSelect label="Job type" required value={form.job_type} onChange={changeJobType}>
              {pairs(JOB_TYPES)}
            </FloatingSelect>
          </div>
          <div className="col-3">
            <FloatingSelect label="Priority" required value={form.priority} onChange={update('priority')} error={errors.priority}>
              {pairs(PRIORITIES)}
            </FloatingSelect>
          </div>
          <div className="col-3">
            <FloatingSelect label="Work mode" value={form.work_mode} onChange={update('work_mode')} error={errors.work_mode}>
              {pairs(WORK_MODES)}
            </FloatingSelect>
          </div>
          <div className="col-3">
            <FloatingInput label="Work location" maxLength={200} value={form.work_location} onChange={update('work_location')} error={errors.work_location} />
          </div>

          {/* Row: 3 per row */}
          <FloatingInput label="Total experience (years)" type="number" min={0} max={60} step={0.5} value={form.total_experience} onChange={update('total_experience')} error={errors.total_experience} />
          <FloatingInput label="Relevant experience (years)" type="number" min={0} max={60} step={0.5} value={form.relevant_experience} onChange={update('relevant_experience')} error={errors.relevant_experience} />
          <FloatingInput label="Min budget" type="number" min={0} value={form.budget_min} onChange={update('budget_min')} error={errors.budget_min} />

          {/* Row: 4 per row */}
          <div className="col-3">
            <FloatingInput label="Max budget" type="number" min={0} value={form.budget_max} onChange={update('budget_max')} error={errors.budget_max} />
          </div>
          <div className="col-3">
            <FloatingDate label="Requirement date" value={form.requirement_date} onChange={(date) => set('requirement_date', date)} error={errors.requirement_date} />
          </div>
          <div className="col-3">
            <FloatingInput label="No. of positions" required type="number" min={1} max={1000} value={form.no_of_positions} onChange={update('no_of_positions')} error={errors.no_of_positions} />
          </div>
          <div className="col-3">
            <FloatingInput label="Contract duration" maxLength={100} value={form.contract_duration} onChange={update('contract_duration')} error={errors.contract_duration} hint={errors.contract_duration ? undefined : 'e.g. 12 months'} />
          </div>

          {/* Row: 2 per row */}
          <div className="col-6">
            <TagInput label="Primary skills" value={form.primary_skills} onChange={(v) => set('primary_skills', v)} fetchSuggestions={skillsApi.search} error={errors.primary_skills} hint={errors.primary_skills ? undefined : 'Type a skill and press Enter'} />
          </div>
          <div className="col-6">
            <TagInput label="Secondary skills" value={form.secondary_skills} onChange={(v) => set('secondary_skills', v)} fetchSuggestions={skillsApi.search} error={errors.secondary_skills} />
          </div>

          {/* Row: 3 per row */}
          <div>
            <MultiSelect
              label="Recruiters"
              options={lookups.users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name ?? ''}`.trim(), hint: u.role?.name }))}
              value={form.recruiter_ids}
              onChange={(ids) => set('recruiter_ids', ids)}
              primary={form.primary_recruiter_id}
              onPrimaryChange={(recruiterId) => set('primary_recruiter_id', recruiterId)}
              error={errors.recruiter_ids || errors.primary_recruiter_id}
              hint="★ marks the primary recruiter"
            />
          </div>
          <div>
            <MultiSelect
              label="Vendors"
              options={lookups.vendors.map((v) => ({ value: v.id, label: v.name, hint: v.contact_person }))}
              value={form.vendor_ids}
              onChange={(ids) => set('vendor_ids', ids)}
              error={errors.vendor_ids}
            />
          </div>

          <FloatingSelect label="Status" value={form.status_id} onChange={update('status_id')} error={errors.status_id} hint={isEdit ? undefined : 'Leave empty to start as Draft'}>
            {options(lookups.jobStatuses)}
          </FloatingSelect>
          {selectedStatus?.is_final && (
            <div className="col-12">
              <FloatingInput label="Closing reason" maxLength={255} value={form.closed_reason} onChange={update('closed_reason')} error={errors.closed_reason} />
            </div>
          )}

          <div className="col-12 form-actions">
            <Button variant="secondary" onClick={() => navigate(backTo)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} loading={saving}>
              {isEdit ? 'Save changes' : 'Create job'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
