import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { useApp } from '../../store/appStore'
import { homePathFor } from '../../store/selectors'

export function Login() {
  const navigate = useNavigate()
  const login = useApp((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const err = login(email, password)
    if (err) return setError(err)
    const s = useApp.getState()
    navigate(homePathFor(s.users.find((u) => u.id === s.currentUserId) ?? null, s.therapists), { replace: true })
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
        <Button size="lg" type="submit">
          Log In
        </Button>
        <p className="text-center text-body-md text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary">
            Register
          </Link>
        </p>
        <div className="rounded-lg bg-secondary-container px-sm py-sm text-center text-label-md text-on-secondary-container">
          <p className="font-semibold">Demo accounts</p>
          <p>Master Admin (Kuya): admin@reliefexpert.app / admin123</p>
          <p>Sub-Admin (Erick): staff@reliefexpert.app / staff123</p>
          <p>Patients: maria@example.com · ahmed@example.com / patient123</p>
        </div>
      </form>
    </AuthShell>
  )
}
