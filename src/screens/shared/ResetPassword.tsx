import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { toast } from '../../components/Toast'
import { mgResetPassword } from '../../lib/manggaleh/auth'

/** Landing page for the manggaleh password-reset email link (carries ?token=...). */
export function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // token normally arrives as a query param; fall back to scraping the raw URL
  // in case the email link encodes it differently.
  const token = params.get('token') || /[?&]token=([^&]+)/.exec(window.location.href)?.[1] || ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) return setError('This reset link is invalid or has expired. Please request a new one.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy(true)
    try {
      await mgResetPassword(decodeURIComponent(token), password)
      toast.success('Password reset. Please log in.')
      navigate('/login', { replace: true })
    } catch {
      setError('Could not reset the password. The link may have expired — request a new one.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <TopBar title="Set New Password" back />
      <div className="px-margin-mobile py-lg">
        <form onSubmit={submit} className="space-y-md">
          {error && <Banner kind="error">{error}</Banner>}
          {!token && <Banner kind="error">No reset token found in the link. Open the link from your email on this device.</Banner>}
          <p className="text-body-md text-on-surface-variant">Choose a new password for your account.</p>
          <Field label="New password" hint="At least 6 characters">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button size="lg" type="submit" disabled={busy || !token}>
            {busy ? 'Saving…' : 'Save Password'}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
