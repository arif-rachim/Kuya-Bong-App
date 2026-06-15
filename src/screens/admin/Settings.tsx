import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Button, Card } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { useApp } from '../../store/appStore'
import { useCurrentUser } from '../../store/selectors'

export function AdminSettings() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const logout = useApp((s) => s.logout)
  const requireApproval = useApp((s) => s.requireApproval)
  const setRequireApproval = useApp((s) => s.setRequireApproval)

  async function resetDemo() {
    const ok = await confirm({
      title: 'Reset demo data?',
      message: 'This restores all demo data to its initial state and reloads the app. Any changes you made will be lost.',
      confirmLabel: 'Reset',
      danger: true,
    })
    if (!ok) return
    localStorage.removeItem('kuya-bong-store')
    location.reload()
  }

  async function doLogout() {
    const ok = await confirm({
      title: 'Log out?',
      message: "You'll need to sign in again to access the admin area.",
      confirmLabel: 'Log out',
      danger: true,
    })
    if (!ok) return
    logout()
    navigate('/welcome', { replace: true })
  }

  function toggleApproval() {
    const next = !requireApproval
    setRequireApproval(next)
    toast.success(next ? 'New bookings now need approval.' : 'New bookings auto-confirm.')
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle={user?.name} />
      <div className="space-y-sm p-md">
        <Card>
          <div className="flex items-center gap-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <Icon name="rule" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label-lg text-label-lg text-on-surface">Require booking approval</p>
              <p className="text-label-md text-on-surface-variant">
                New patient bookings wait for your approval instead of auto-confirming.
              </p>
            </div>
            <Toggle on={requireApproval} onChange={toggleApproval} />
          </div>
        </Card>

        <Card onClick={() => navigate('/admin/services')}>
          <Item icon="medical_services" label="Service Types" desc="Services & durations" />
        </Card>
        <Card onClick={() => navigate('/admin/therapists')}>
          <Item icon="person" label="Therapists" desc="Who delivers treatments" />
        </Card>
        <Card onClick={() => navigate('/admin/cancellation-reasons')}>
          <Item icon="cancel" label="Cancellation Reasons" desc="Reasons for cancelling" />
        </Card>
        <Card onClick={() => navigate('/admin/clinic-settings')}>
          <Item icon="apartment" label="Clinic Settings" desc="Edit Clinic A & B names" />
        </Card>
        <Card onClick={() => navigate('/admin/follow-ups')}>
          <Item icon="medication" label="Follow-up List" desc="Patients to contact" />
        </Card>
        <Card onClick={resetDemo}>
          <Item icon="restart_alt" label="Reset Demo Data" desc="Restore initial data" />
        </Card>

        <Button variant="ghost" size="lg" onClick={doLogout}>
          <Icon name="logout" size={20} /> Log Out
        </Button>
      </div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={
        'relative h-7 w-12 shrink-0 rounded-full transition-colors ' +
        (on ? 'bg-primary' : 'bg-outline-variant')
      }
    >
      <span
        className={
          'absolute top-1 h-5 w-5 rounded-full bg-surface-container-lowest shadow transition-all ' +
          (on ? 'left-6' : 'left-1')
        }
      />
    </button>
  )
}

function Item({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
        <Icon name={icon} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-label-lg text-label-lg text-on-surface">{label}</p>
        <p className="text-label-md text-on-surface-variant">{desc}</p>
      </div>
      <Icon name="chevron_right" className="text-on-surface-variant" />
    </div>
  )
}
