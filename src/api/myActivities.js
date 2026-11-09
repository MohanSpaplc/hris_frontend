import api from './client'

export const myActivitiesApi = {
  list: (params) => api.get('/my-activities', { params }).then((r) => r.data),
  /** Stages the logged-in user can pick (TAG side for TAG roles, HR side for HR). */
  stages: () => api.get('/my-activities/stages').then((r) => r.data.data),
  changeStage: (id, payload) => api.patch(`/my-activities/${id}/stage`, payload).then((r) => r.data.data),
  history: (id) => api.get(`/my-activities/${id}/history`).then((r) => r.data.data),
}
