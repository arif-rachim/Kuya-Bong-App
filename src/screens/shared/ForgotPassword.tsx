import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { MOCK_OTP, useApp } from '../../store/appStore'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { mgForgetPassword } from '../../lib/manggaleh/auth'

export function ForgotPassword() {
  const navigate = useNavigate()
  const resetPassword = useApp((s) => s.resetPassword)
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function next(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (isManggalehEnabled()) {
      // manggaleh emails a reset link (token); the new password is set on the
      // /reset-password page the link lands on. Always confirm (don't leak existence).
      setBusy(true)
      try {
        await mgForgetPassword(email, `${window.location.origin}/#/reset-password`)
        setSent(true)
      } catch {
        setSent(true) // still show the neutral confirmation
      } finally {
        setBusy(false)
      }
      return
    }
    const exists = useApp.getState().users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!exists) return setError('Email is not registered.')
    setStep(2)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const err = resetPassword(email, code, password)
    if (err) return setError(err)
    navigate('/login', { replace: true })
  }

  return (
    <AuthShell>
      <TopBar title="Reset Password" back />
      <div className="px-margin-mobile py-lg">
        {sent ? (
          <div className="space-y-md">
            <Banner kind="success">If an account exists for <span className="font-semibold">{email}</span>, we've sent a password-reset link. Open it on this device to set a new password.</Banner>
            <Button size="lg" variant="secondary" onClick={() => navigate('/login', { replace: true })}>Back to Log In</Button>
          </div>
        ) : step === 1 ? (
          <form onSubmit={next} className="space-y-md">
            {error && <Banner kind="error">{error}</Banner>}
            <p className="text-body-md text-on-surface-variant">Enter your account email and we'll send you a reset link.</p>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Button size="lg" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-md">
            {error && <Banner kind="error">{error}</Banner>}
            <Field label="Verification code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 digits" required />
            </Field>
            <Field label="New password" hint="At least 6 characters">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button size="lg" type="submit">
              Save Password
            </Button>
            <Banner kind="info">Demo: use code {MOCK_OTP}</Banner>
          </form>
        )}
      </div>
    </AuthShell>
  )
}
