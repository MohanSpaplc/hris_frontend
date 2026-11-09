import api from './client'

export const countriesApi = {
  list: (params) => api.get('/countries', { params }).then((r) => r.data),
  create: (payload) => api.post('/countries', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/countries/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/countries/${id}`).then((r) => r.data),
}

export const statusesApi = {
  list: (module) => api.get('/statuses', { params: { module } }).then((r) => r.data.data),
}
