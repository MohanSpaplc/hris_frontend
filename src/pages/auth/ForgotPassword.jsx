import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, CheckCircle2, Mail, Send } from 'lucide-react'
import { authApi } from '../../api/auth'
import { errorMessage, fieldErrors } from '../../api/client'
import Button from '../../components/Button'
import { TextInput } from '../../components/FormField'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const data = await authApi.forgotPassword(email.trim())
      setSentMessage(data.message)
    } catch (err) {
      const fields = fieldErrors(err)
      if (fields.email) setError(fields.email)
      else toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sentMessage) {
    return (
      <div style={{ textAlign: 'center' }}>
        <CheckCircle2 size={44} color="var(--ok)" style={{ marginBottom: 12 }} />
        <h2>Check your email</h2>
        <p className="auth-sub">{sentMessage} The link expires in 30 minutes.</p>
        <Link to="/login" className="btn btn-secondary btn-block">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2>Forgot password?</h2>
      <p className="auth-sub">Enter your work email and we will send you a reset link.</p>

      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="name@company.com"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          error={error}
          maxLength={255}
        />

        <Button type="submit" block loading={submitting} icon={Send}>
          Send reset link
        </Button>

        <Link to="/login" className="auth-back">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </form>
    </>
  )
}
