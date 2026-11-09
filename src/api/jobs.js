import api from './client'

export const jobsApi = {
  list: (params) => api.get('/jobs', { params }).then((r) => r.data),
  get: (id) => api.get(`/jobs/${id}`).then((r) => r.data.data),
  /** All job dropdown data in one request. */
  formOptions: () => api.get('/jobs/form-options').then((r) => r.data.data),
  create: (payload) => api.post('/jobs', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/jobs/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/jobs/${id}`).then((r) => r.data),

  /** Reads a JD file on the server and returns { job_description, fields } suggestions. Nothing is saved. */
  parseJd: (file) => api.post('/jobs/parse-jd', toFormData(file), MULTIPART).then((r) => r.data.data),
  uploadJdFile: (id, file) => api.post(`/jobs/${id}/jd-file`, toFormData(file), MULTIPART).then((r) => r.data.data),
  removeJdFile: (id) => api.delete(`/jobs/${id}/jd-file`).then((r) => r.data),
  /** Downloads with the auth token (a plain link would not send it) and saves it with its original name. */
  downloadJdFile: async (id, fileName) => {
    const response = await api.get(`/jobs/${id}/jd-file`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = Object.assign(document.createElement('a'), { href: url, download: fileName || 'job-description' })
    link.click()
    URL.revokeObjectURL(url)
  },
}

// Override the default JSON header so axios sends real multipart data.
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }
const toFormData = (file) => {
  const body = new FormData()
  body.append('file', file)
  return body
}

export const skillsApi = {
  /** Skill names starting with `search` (for TagInput suggestions). */
  search: (search) => api.get('/skills', { params: { search } }).then((r) => r.data.data.map((skill) => skill.name)),
}

export const JOB_TYPES = [
  ['external', 'External (client)'],
  ['internal', 'Internal'],
]

export const WORK_MODES = [
  ['onsite', 'Onsite'],
  ['remote', 'Remote'],
  ['hybrid', 'Hybrid'],
]

export const EMPLOYMENT_TYPES = [
  ['full_time', 'Full-time'],
  ['contract', 'Contract'],
  ['c2h', 'Contract to hire'],
  ['intern', 'Internship'],
]

export const PRIORITIES = [
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['urgent', 'Urgent'],
]

export const labelFor = (list, value) => list.find(([key]) => key === value)?.[1] ?? value ?? '—'
