import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullPageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <span className="btn btn-ghost is-loading">Loading…</span>
    </div>
  )
}

/** Only logged-in users. Optional `permission` hides pages the role cannot use. */
export function ProtectedRoute({ permission }) {
  const { isAuthenticated, isBooting, can } = useAuth()
  const location = useLocation()

  if (isBooting) return <FullPageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (permission && !can(permission)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

/** Login / forgot / reset pages: redirect away if already logged in. */
export function GuestRoute() {
  const { isAuthenticated, isBooting } = useAuth()

  if (isBooting) return <FullPageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
