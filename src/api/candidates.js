import api from './client'

export const candidatesApi = {
  list: (params) => api.get('/candidates', { params }).then((r) => r.data),
  get: (id) => api.get(`/candidates/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/candidates', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/candidates/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/candidates/${id}`).then((r) => r.data),

  /** Reads a resume on the server and returns { fields } suggestions. Nothing is saved. */
  parseResume: (file) => {
    const body = new FormData()
    body.append('file', file)
    return api.post('/candidates/parse-resume', body, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data)
  },

  documents: (id) => api.get(`/candidates/${id}/documents`).then((r) => r.data.data),
  uploadDocument: (id, documentType, file) => {
    const body = new FormData()
    body.append('document_type', documentType)
    body.append('file', file)
    // Override the default JSON header so axios sends real multipart data.
    return api.post(`/candidates/${id}/documents`, body, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data)
  },
  setDocumentStatus: (id, documentId, statusId) => api.patch(`/candidates/${id}/documents/${documentId}`, { status_id: statusId }).then((r) => r.data.data),
  removeDocument: (id, documentId) => api.delete(`/candidates/${id}/documents/${documentId}`).then((r) => r.data),
  /** Downloads with the auth token (a plain link would not send it) and saves it with its original name. */
  downloadDocument: async (id, document) => {
    const response = await api.get(`/candidates/${id}/documents/${document.id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = Object.assign(window.document.createElement('a'), { href: url, download: document.original_filename || 'document' })
    link.click()
    URL.revokeObjectURL(url)
  },
}

export const GENDERS = [
  ['male', 'Male'],
  ['female', 'Female'],
  ['other', 'Other'],
  ['prefer_not_to_say', 'Prefer not to say'],
]

export const RESUME_SOURCES = [
  ['portal', 'Job portal'],
  ['referral', 'Referral'],
  ['vendor', 'Vendor'],
  ['direct', 'Direct'],
  ['linkedin', 'LinkedIn'],
]

export const DOCUMENT_TYPES = [
  ['resume', 'Resume'],
  ['photo', 'Photo'],
  ['certificate', 'Certificate'],
  ['id_proof', 'ID proof'],
  ['relieving_letter', 'Relieving letter'],
  ['payslip', 'Payslip'],
  ['offer_letter', 'Offer letter'],
  ['other', 'Other'],
]

/** Allowed extensions per document type (same as the server). */
export const DOCUMENT_EXTENSIONS = {
  resume: ['pdf', 'docx', 'txt'],
  photo: ['jpg', 'jpeg', 'png', 'webp'],
  other: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
}
export const extensionsFor = (type) => DOCUMENT_EXTENSIONS[type] ?? DOCUMENT_EXTENSIONS.other
