import api from './client'

export const clientsApi = {
  list: (params) => api.get('/clients', { params }).then((r) => r.data),
  create: (payload) => api.post('/clients', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/clients/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/clients/${id}`).then((r) => r.data),
  uploadLogo: (id, file) => {
    const body = new FormData()
    body.append('logo', file)
    // Override the default JSON header so axios sends real multipart data.
    return api.post(`/clients/${id}/logo`, body, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data)
  },
  removeLogo: (id) => api.delete(`/clients/${id}/logo`).then((r) => r.data.data),
}

export const clientManagersApi = {
  list: (params) => api.get('/client-managers', { params }).then((r) => r.data),
  create: (payload) => api.post('/client-managers', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/client-managers/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/client-managers/${id}`).then((r) => r.data),
}
