import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { AuthShell } from '../../components/AuthShell'
import { Logo } from '../../components/Logo'
import { Button } from '../../components/ui'
import { useApp } from '../../store/appStore'

export function Welcome() {
  const navigate = useNavigate()
  const loginAs = useApp((s) => s.loginAs)

  function demo(role: 'patient' | 'admin') {
    loginAs(role)
    navigate(role === 'admin' ? '/admin/dashboard' : '/patient/home', { replace: true })
  }

  return (
    <AuthShell>
      <div className="flex flex-1 flex-col px-margin-mobile pb-lg pt-xl">
      <header>
        <Logo className="text-2xl" tagline />
      </header>

      <div className="flex flex-1 flex-col justify-center py-lg">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Welcome to <span className="text-primary">Realief Expert</span>
        </h1>
        <p className="mt-sm font-body-lg text-body-lg text-on-surface-variant">
          Professional physiotherapy &amp; chiropractic care. Book appointments, manage packages, and track your
          schedule across two clinics — all in a few taps.
        </p>

        {/* Clinic locations */}
        <div className="mt-lg grid grid-cols-2 gap-sm border-t border-outline-variant pt-md">
          <div className="flex items-center gap-sm">
            <div className="h-12 w-2 rounded-full bg-clinic-a" />
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">Clinic A</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Deep Sea Center</p>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <div className="h-12 w-2 rounded-full bg-clinic-b" />
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">Clinic B</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Healing Leaf Annex</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-sm">
        <Button size="lg" onClick={() => navigate('/register')}>
          Register
          <Icon name="arrow_forward" size={20} />
        </Button>
        <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
          Log In
        </Button>

        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-md">
          <p className="mb-sm text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
            Quick demo
          </p>
          <div className="grid grid-cols-2 gap-sm">
            <Button variant="ghost" onClick={() => demo('patient')}>
              As Patient
            </Button>
            <Button variant="ghost" onClick={() => demo('admin')}>
              As Admin
            </Button>
          </div>
        </div>
      </div>
      </div>
    </AuthShell>
  )
}
