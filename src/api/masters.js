import api from './client'

/** CRUD helpers for a simple REST resource: list / create / update / remove. */
const resource = (path) => ({
  list: (params) => api.get(path, { params }).then((r) => r.data),
  create: (payload) => api.post(path, payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`${path}/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`${path}/${id}`).then((r) => r.data),
})

export const practiceAreasApi = resource('/practice-areas')
export const vendorsApi = resource('/vendors')
export const usersApi = { list: (params) => api.get('/users', { params }).then((r) => r.data) }
