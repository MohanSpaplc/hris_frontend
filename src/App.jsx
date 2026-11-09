import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { GuestRoute, ProtectedRoute } from './components/RouteGuards'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import ComingSoon from './pages/ComingSoon'
import Dashboard from './pages/Dashboard'
import ClientManagers from './pages/client-managers/ClientManagers'
import Clients from './pages/clients/Clients'
import Countries from './pages/countries/Countries'
import NotFound from './pages/NotFound'
import JobViewPage from './pages/jobs/JobViewPage'
import AssignedJobs from './pages/jobs/AssignedJobs'
import Jobs from './pages/jobs/Jobs'
import CandidateFormPage from './pages/candidates/CandidateFormPage'
import CandidateViewPage from './pages/candidates/CandidateViewPage'
import Candidates from './pages/candidates/Candidates'
import MyActivities from './pages/my-activities/MyActivities'

// Heavy (rich text editor): loaded only when a job form is opened.
const JobFormPage = lazy(() => import('./pages/jobs/JobFormPage'))
const pageLoader = (
  <div className="card card-body empty-state">
    <span className="btn btn-ghost is-loading">Loading…</span>
  </div>
)
import PracticeAreas from './pages/practice-areas/PracticeAreas'
import Vendors from './pages/vendors/Vendors'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<ComingSoon title="Settings" />} />
              <Route element={<ProtectedRoute permission="jobs.view" />}>
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/assigned-jobs" element={<AssignedJobs />} />
                <Route path="/assigned-jobs/:id" element={<JobViewPage key="assigned" readOnly />} />
                <Route path="/jobs/:id" element={<JobViewPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="jobs.create" />}>
                <Route path="/jobs/new" element={<Suspense fallback={pageLoader}><JobFormPage /></Suspense>} />
              </Route>
              <Route element={<ProtectedRoute permission="jobs.update" />}>
                <Route path="/jobs/:id/edit" element={<Suspense fallback={pageLoader}><JobFormPage /></Suspense>} />
              </Route>
              <Route element={<ProtectedRoute permission="candidates.view" />}>
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/candidates/:id" element={<CandidateViewPage />} />
                <Route path="/my-activities" element={<MyActivities />} />
              </Route>
              <Route element={<ProtectedRoute permission="candidates.create" />}>
                <Route path="/candidates/new" element={<CandidateFormPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="candidates.update" />}>
                <Route path="/candidates/:id/edit" element={<CandidateFormPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="masters.view" />}>
                <Route path="/countries" element={<Countries />} />
                <Route path="/practice-areas" element={<PracticeAreas />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/client-managers" element={<ClientManagers />} />
                <Route path="/vendors" element={<Vendors />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3500} newestOnTop closeOnClick pauseOnHover theme="light" limit={4} />
      </AuthProvider>
    </BrowserRouter>
  )
}
