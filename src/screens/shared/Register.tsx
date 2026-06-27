import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { useApp } from '../../store/appStore'
import { homePathFor } from '../../store/selectors'
import { isManggalehEnabled, isManggalehOtpEnabled } from '../../lib/manggaleh/client'
import { registerPatient } from '../../lib/manggaleh/write'
import { mgSendOtp } from '../../lib/manggaleh/auth'
import { hydrateFromManggaleh } from '../../lib/manggaleh/hydrate'

export function Register() {
  const navigate = useNavigate()
  const register = useApp((s) => s.register)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim())
      return setError('Please fill in all required fields.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (isManggalehEnabled()) {
      setBusy(true)
      try {
        await registerPatient({ name: form.name, email: form.email, password: form.password })
        if (isManggalehOtpEnabled()) {
          // require email verification before entering the app
          await mgSendOtp(form.email)
          navigate(`/verify-email/${encodeURIComponent(form.email.trim().toLowerCase())}`, { replace: true })
          return
        }
        await hydrateFromManggaleh()
        const s = useApp.getState()
        navigate(homePathFor(s.users.find((u) => u.id === s.currentUserId) ?? null, s.therapists), { replace: true })
      } catch {
        setError('Could not create the account. The email may already be registered.')
      } finally {
        setBusy(false)
      }
      return
    }
    const res = register(form)
    if (res.error) return setError(res.error)
    navigate(`/verify/${res.userId}`, { replace: true })
  }

  return (
    <AuthShell>
      <TopBar title="Create Account" back />
      <form onSubmit={submit} className="space-y-md px-margin-mobile py-lg">
        {error && <Banner kind="error">{error}</Banner>}
        <Field label="Full name">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </Field>
        <Field label="Mobile number">
          <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="+971 50 123 4567" required />
        </Field>
        <Field label="Password" hint="At least 6 characters">
          <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />
        </Field>
        <Button size="lg" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Continue to Verification'}
          <Icon name="arrow_forward" size={20} />
        </Button>
        <p className="text-center text-body-md text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Log In
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
