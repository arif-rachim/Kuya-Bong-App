import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { MOCK_OTP, useApp } from '../../store/appStore'

export function ForgotPassword() {
  const navigate = useNavigate()
  const resetPassword = useApp((s) => s.resetPassword)
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function next(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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
        {step === 1 ? (
          <form onSubmit={next} className="space-y-md">
            {error && <Banner kind="error">{error}</Banner>}
            <p className="text-body-md text-on-surface-variant">Enter your account email to verify your identity.</p>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Button size="lg" type="submit">
              Send Code
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
