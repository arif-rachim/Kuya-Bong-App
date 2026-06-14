import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Button, Card, EmptyState, SectionTitle } from '../../components/ui'
import { ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { useApp } from '../../store/appStore'
import { todayISO } from '../../lib/date'

export function AdminDashboard() {
  const navigate = useNavigate()
  const clinics = useApp((s) => s.clinics)
  const today = todayISO()
  const appointments = useApp((s) => s.appointments)
  const purchases = useApp((s) => s.purchases)
  const users = useApp((s) => s.users)
  const approve = useApp((s) => s.approveAppointment)
  const reject = useApp((s) => s.rejectAppointment)

  const todays = appointments
    .filter((a) => a.date === today && (a.status === 'Confirmed' || a.status === 'Rescheduled'))
    .sort((a, b) => a.start.localeCompare(b.start))
  const pending = appointments.filter((a) => a.status === 'PendingApproval')
  const followUps = purchases.filter((p) => p.followUpStatus === 'Due')

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? ''
  const patientName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'

  async function doApprove(id: string, who: string, when: string) {
    const ok = await confirm({
      title: 'Approve booking?',
      message: `Approve ${who}'s request for ${when}? The slot will be confirmed.`,
      confirmLabel: 'Approve',
    })
    if (!ok) return
    approve(id)
    toast.success('Booking approved.')
  }

  async function doReject(id: string, who: string, when: string) {
    const ok = await confirm({
      title: 'Reject booking?',
      message: `Reject ${who}'s request for ${when}? The slot will be freed for others.`,
      confirmLabel: 'Reject',
      danger: true,
    })
    if (!ok) return
    reject(id)
    toast.info('Booking rejected.')
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Today's overview" />
      <div className="space-y-md p-md">
        <div className="grid grid-cols-3 gap-sm">
          <StatCard label="Today's appointments" value={todays.length} icon="event_available" />
          <StatCard label="Pending requests" value={pending.length} icon="pending_actions" />
          <StatCard label="Follow-ups" value={followUps.length} icon="priority_high" tone="error" />
        </div>

        <section>
          <SectionTitle>Today's Schedule</SectionTitle>
          {todays.length === 0 ? (
            <EmptyState icon="event_busy" title="No appointments today" />
          ) : (
            <div className="space-y-sm">
              {todays.map((a) => (
                <Card key={a.id} className="p-sm">
                  <Link to="/admin/appointments" className="flex items-center gap-md">
                    <div className="w-16 shrink-0 text-center">
                      <p className="font-label-lg text-label-lg text-primary">{a.start}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">{a.end}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-label-lg text-label-lg text-on-surface">{a.forMemberName}</h4>
                      <div className="mt-xs"><ClinicBadge clinicId={a.clinicId} name={clinicName(a.clinicId)} /></div>
                    </div>
                    <Icon name="chevron_right" className="text-outline" />
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>

        {pending.length > 0 && (
          <section>
            <SectionTitle>Pending Approval Requests</SectionTitle>
            <div className="space-y-sm">
              {pending.map((a) => (
                <Card key={a.id} className="bg-surface-container-low">
                  <div className="flex items-center justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{patientName(a.patientUserId)}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        {a.date} · {a.start} · {clinicName(a.clinicId)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-sm grid grid-cols-2 gap-sm">
                    <Button
                      size="sm"
                      onClick={() => doApprove(a.id, patientName(a.patientUserId), `${a.date} ${a.start}`)}
                    >
                      <Icon name="check" size={16} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => doReject(a.id, patientName(a.patientUserId), `${a.date} ${a.start}`)}
                    >
                      <Icon name="close" size={16} /> Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-sm">
          <QuickAction icon="event_available" label="Manual Booking" onClick={() => navigate('/admin/manual-booking')} />
          <QuickAction icon="medication" label="Follow-up List" onClick={() => navigate('/admin/follow-ups')} />
          <QuickAction icon="inventory_2" label="Packages" onClick={() => navigate('/admin/packages')} />
          <QuickAction icon="groups" label="Patients" onClick={() => navigate('/admin/patients')} />
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: string; tone?: 'error' }) {
  return (
    <Card className="flex flex-col gap-sm p-md">
      <div
        className={
          tone === 'error'
            ? 'flex h-10 w-10 items-center justify-center rounded-lg bg-error-container text-error'
            : 'flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary'
        }
      >
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <p className="font-headline-sm text-headline-sm text-on-surface">{value}</p>
      </div>
    </Card>
  )
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <Card onClick={onClick}>
      <div className="mb-sm flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
        <Icon name={icon} size={20} />
      </div>
      <p className="font-label-lg text-label-lg text-on-surface">{label}</p>
    </Card>
  )
}
