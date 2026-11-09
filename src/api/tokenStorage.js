// "Remember me" keeps the token in localStorage; otherwise it lives only for this browser tab session.
const KEY = 'hris_token'

export const tokenStorage = {
  get() {
    try {
      return sessionStorage.getItem(KEY) || localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token, remember) {
    try {
      this.clear()
      ;(remember ? localStorage : sessionStorage).setItem(KEY, token)
    } catch {
      // storage blocked (private mode) — user will need to log in again on reload
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY)
      localStorage.removeItem(KEY)
    } catch {
      // ignore
    }
  },
}
