import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { TopBar } from '../../components/TopBar'
import { AuthShell } from '../../components/AuthShell'
import { Banner, Button, Field, Input } from '../../components/ui'
import { toast } from '../../components/Toast'
import { MOCK_OTP, useApp } from '../../store/appStore'

export function Verify() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const verify = useApp((s) => s.verify)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const err = verify(userId, code)
    if (err) return setError(err)
    toast.success('Account verified. Welcome!')
    navigate('/patient/home', { replace: true })
  }

  return (
    <AuthShell>
      <TopBar title="Verify Account" back />
      <div className="px-margin-mobile py-lg">
        <div className="mb-lg flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-fixed text-primary">
            <Icon name="mark_email_read" size={30} />
          </div>
          <p className="mt-md text-body-md text-on-surface-variant">
            We sent a verification code to your email and mobile number. Enter the code to activate your account.
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
          <Button size="lg" type="submit">
            Verify
          </Button>
          <p className="text-center text-body-md text-on-surface-variant">
            Didn't receive a code?{' '}
            <button type="button" className="font-semibold text-primary">
              Resend
            </button>
          </p>
          <Banner kind="info">Demo: use code {MOCK_OTP}</Banner>
        </form>
      </div>
    </AuthShell>
  )
}
