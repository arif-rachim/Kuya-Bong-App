import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { useApp } from '../../store/appStore'
import { homePathFor } from '../../store/selectors'
import { isManggalehEnabled, ManggalehError } from '../../lib/manggaleh/client'
import { mgSignIn } from '../../lib/manggaleh/auth'
import { hydrateFromManggaleh } from '../../lib/manggaleh/hydrate'

export function Login() {
  const navigate = useNavigate()
  const login = useApp((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function goHome() {
    const s = useApp.getState()
    navigate(homePathFor(s.users.find((u) => u.id === s.currentUserId) ?? null, s.therapists), { replace: true })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isManggalehEnabled()) {
      setBusy(true)
      try {
        await mgSignIn(email.trim(), password)
        await hydrateFromManggaleh()
        goHome()
      } catch (err) {
        setError(err instanceof ManggalehError && err.status === 401 ? 'Incorrect email or password.' : 'Sign-in failed. Please try again.')
      } finally {
        setBusy(false)
      }
      return
    }
    const err = login(email, password)
    if (err) return setError(err)
    goHome()
  }

  return (
    <AuthShell>
      <TopBar title="Log In" back />
      <form onSubmit={submit} className="space-y-md px-margin-mobile py-lg">
        {error && <Banner kind="error">{error}</Banner>}
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </Field>
        <div className="text-right">
          <Link to="/forgot" className="font-label-lg text-label-lg text-primary">
            Forgot password?
          </Link>
        </div>
        <Button size="lg" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Log In'}
        </Button>
        <p className="text-center text-body-md text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
