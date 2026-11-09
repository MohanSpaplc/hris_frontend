import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'
import { tokenStorage } from '../api/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [isBooting, setIsBooting] = useState(() => Boolean(tokenStorage.get()))

  const resetSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setPermissions([])
  }, [])

  // Restore the session from a saved token.
  useEffect(() => {
    setUnauthorizedHandler(resetSession)
    if (!tokenStorage.get()) return

    authApi
      .me()
      .then((data) => {
        setUser(data.user)
        setPermissions(data.permissions)
      })
      .catch(resetSession)
      .finally(() => setIsBooting(false))
  }, [resetSession])

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await authApi.login({ email, password, device_name: 'web' })
    tokenStorage.set(data.token, remember)
    setUser(data.user)
    setPermissions(data.permissions)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      resetSession()
    }
  }, [resetSession])

  const value = useMemo(
    () => ({
      user,
      permissions,
      isAuthenticated: Boolean(user),
      isBooting,
      login,
      logout,
      can: (permission) => permissions.includes(permission),
      hasRole: (...codes) => codes.includes(user?.role?.code),
    }),
    [user, permissions, isBooting, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
