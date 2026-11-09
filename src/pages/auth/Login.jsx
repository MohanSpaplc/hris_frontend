import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AlertCircle, Lock, LogIn, Mail } from 'lucide-react'
import { errorMessage, fieldErrors } from '../../api/client'
import Button from '../../components/Button'
import { PasswordInput, TextInput } from '../../components/FormField'
import { useAuth } from '../../context/AuthContext'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
    setFormError('')
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Enter your email address.'
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    return !Object.keys(next).length
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const user = await login({ email: form.email.trim(), password: form.password, remember: form.remember })
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (error) {
      const fields = fieldErrors(error)
      // Credential errors come back on "email"; show them once above the form.
      if (fields.email && !fields.password) setFormError(fields.email)
      else setErrors(fields)
      if (!Object.keys(fields).length) setFormError(errorMessage(error))
      setForm((f) => ({ ...f, password: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h2>Sign in</h2>
      <p className="auth-sub">Welcome back. Enter your work email to continue.</p>

      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="alert alert-err" role="alert">
            <AlertCircle size={16} style={{ flex: 'none', marginTop: 2 }} />
            {formError}
          </div>
        )}

        <TextInput
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="name@company.com"
          autoComplete="username"
          autoFocus
          required
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          maxLength={255}
        />

        <PasswordInput
          label="Password"
          icon={Lock}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          maxLength={255}
        />

        <div className="auth-row">
          <label className="check">
            <input type="checkbox" checked={form.remember} onChange={update('remember')} />
            Keep me signed in
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <Button type="submit" block loading={submitting} icon={LogIn}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </>
  )
}
