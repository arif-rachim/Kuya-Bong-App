import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { toast } from '../../components/Toast'
import { useApp } from '../../store/appStore'
import { homePathFor } from '../../store/selectors'
import { mgSendOtp, mgVerifyOtp } from '../../lib/manggaleh/auth'
import { hydrateFromManggaleh } from '../../lib/manggaleh/hydrate'

/** Email-OTP verification step for manggaleh registration (see VITE_MANGGALEH_OTP). */
export function VerifyEmail() {
  const { email = '' } = useParams()
  const address = decodeURIComponent(email)
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await mgVerifyOtp(address, code)
      await hydrateFromManggaleh()
      const s = useApp.getState()
      toast.success('Email verified. Welcome!')
      navigate(homePathFor(s.users.find((u) => u.id === s.currentUserId) ?? null, s.therapists), { replace: true })
    } catch {
      setError('That code is incorrect or has expired. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError(null)
    try {
      await mgSendOtp(address)
      toast.success('A new code is on its way.')
    } catch {
      setError('Could not resend the code. Please try again shortly.')
    }
  }

  return (
    <AuthShell>
      <TopBar title="Verify Email" back />
      <div className="px-margin-mobile py-lg">
        <div className="mb-lg flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-fixed text-primary">
            <Icon name="mark_email_read" className="text-3xl" />
          </div>
          <p className="mt-md text-body-md text-on-surface-variant">
            We sent a verification code to <span className="font-semibold text-on-surface">{address}</span>. Enter it to
            activate your account.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-md">
          {error && <Banner kind="error">{error}</Banner>}
          <Field label="Verification code">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="------"
              inputMode="numeric"
              className="text-center text-headline-md tracking-[0.4em]"
              maxLength={6}
              required
            />
          </Field>
          <Button size="lg" type="submit" disabled={busy}>
            {busy ? 'Verifying…' : 'Verify'}
          </Button>
          <p className="text-center text-body-md text-on-surface-variant">
            Didn't receive a code?{' '}
            <button type="button" className="font-semibold text-primary" onClick={resend}>
              Resend
            </button>
          </p>
        </form>
      </div>
    </AuthShell>
  )
}
