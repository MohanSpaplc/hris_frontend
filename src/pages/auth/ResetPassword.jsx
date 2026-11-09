import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AlertCircle, ArrowLeft, KeyRound, Lock } from 'lucide-react'
import { authApi } from '../../api/auth'
import { errorMessage, fieldErrors } from '../../api/client'
import Button from '../../components/Button'
import { PasswordInput } from '../../components/FormField'

// Same rule as the backend: min 10, upper + lower case, number, symbol.
const passwordRules = [
  [(p) => p.length >= 10, 'At least 10 characters'],
  [(p) => /[a-z]/.test(p) && /[A-Z]/.test(p), 'Upper and lower case letters'],
  [(p) => /\d/.test(p), 'At least one number'],
  [(p) => /[^A-Za-z0-9]/.test(p), 'At least one symbol'],
]

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')
  const email = params.get('email')

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (!token || !email) {
    return (
      <>
        <div className="alert alert-err" role="alert">
          <AlertCircle size={16} /> This reset link is invalid or incomplete.
        </div>
        <Link to="/forgot-password" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
          Request a new link
        </Link>
      </>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!passwordRules.every(([test]) => test(password))) next.password = 'Password does not meet all the rules below.'
    if (password !== confirmation) next.password_confirmation = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await authApi.resetPassword({ token, email, password, password_confirmation: confirmation })
      toast.success('Password updated. Sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      const fields = fieldErrors(error)
      if (fields.email) toast.error(fields.email)
      else if (Object.keys(fields).length) setErrors(fields)
      else toast.error(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h2>Set a new password</h2>
      <p className="auth-sub">
        For <b>{email}</b>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <PasswordInput
          label="New password"
          icon={Lock}
          autoComplete="new-password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          maxLength={255}
        />

        <ul style={{ margin: '-6px 0 0', paddingLeft: 18, fontSize: 12 }}>
          {passwordRules.map(([test, label]) => (
            <li key={label} style={{ color: test(password) ? 'var(--ok)' : 'var(--muted)' }}>
              {label}
            </li>
          ))}
        </ul>

        <PasswordInput
          label="Confirm new password"
          icon={Lock}
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={errors.password_confirmation}
          maxLength={255}
        />

        <Button type="submit" block loading={submitting} icon={KeyRound}>
          Update password
        </Button>

        <Link to="/login" className="auth-back">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </form>
    </>
  )
}
