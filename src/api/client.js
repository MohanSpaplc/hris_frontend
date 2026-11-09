import axios from 'axios'
import { tokenStorage } from './tokenStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Called when the token is rejected (expired / revoked / user deactivated).
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isAuthCall = error.config?.url?.startsWith('/auth/login')

    if (!isAuthCall && (status === 401 || (status === 403 && error.response?.data?.message?.includes('inactive')))) {
      tokenStorage.clear()
      onUnauthorized()
    }

    return Promise.reject(error)
  },
)

/** Human-readable message from an API error. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error.response) return 'Cannot reach the server. Check your connection.'
  if (error.response.status === 429) return 'Too many attempts. Please wait a minute and try again.'
  return error.response.data?.message || fallback
}

/** Laravel 422 errors as { field: 'first message' }. */
export function fieldErrors(error) {
  const errors = error.response?.status === 422 ? error.response.data?.errors : null
  if (!errors) return {}
  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]))
}

export default api
