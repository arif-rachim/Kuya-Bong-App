import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { Card, EmptyState } from '../../components/ui'
import { AppointmentStatusBadge, ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { PageIntro } from '../../components/PageIntro'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { useCurrentUser } from '../../store/selectors'
import { formatDate } from '../../lib/date'
import type { Appointment } from '../../data/types'

type Tab = 'upcoming' | 'completed' | 'cancelled' | 'rescheduled'

const tabs: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rescheduled', label: 'Rescheduled' },
]

function matches(a: Appointment, tab: Tab): boolean {
  switch (tab) {
    case 'upcoming':
      return a.status === 'Confirmed' || a.status === 'PendingApproval'
    case 'completed':
      return a.status === 'Completed' || a.status === 'NoShow'
    case 'cancelled':
      return a.status === 'CancelledByPatient' || a.status === 'CancelledByAdmin'
    case 'rescheduled':
      return a.status === 'Rescheduled'
  }
}

export function MyAppointments() {
  const user = useCurrentUser()
  const [tab, setTab] = useState<Tab>('upcoming')
  const clinics = useApp((s) => s.clinics)
  const appointments = useApp((s) => s.appointments)
  const list = appointments
    .filter((a) => a.patientUserId === user?.id)
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
    .filter((a) => matches(a, tab))

  return (
    <div>
      <TopBar title="My Appointments" />
      <div className="px-margin-mobile pt-md">
        <PageIntro>
          All your bookings in one place. Use the tabs to switch between upcoming, completed, cancelled, and
          rescheduled visits, and tap any card to view details, reschedule, or cancel it.
        </PageIntro>
      </div>

      <div className="flex flex-wrap gap-base px-margin-mobile py-md">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-sm font-label-lg text-label-lg transition-colors',
              tab === t.key
                ? 'bg-primary-container text-on-primary'
                : 'bg-secondary-container text-on-secondary-container',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-sm px-margin-mobile pb-md">
        {list.length === 0 ? (
          <EmptyState icon="event" title="No appointments yet" subtitle="Your appointments will appear here." />
        ) : (
          list.map((a) => {
            const clinicName = clinics.find((c) => c.id === a.clinicId)?.name ?? ''
            const accent = a.clinicId === 'clinic-a' ? 'a' : 'b'
            return (
              <Link key={a.id} to={`/patient/appointment/${a.id}`} className="block">
                <Card accent={accent}>
                  <div className="flex items-center justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="font-headline-sm text-headline-sm text-on-surface">{formatDate(a.date)}</p>
                      <div className="mt-xs flex items-center gap-xs text-on-surface-variant">
                        <Icon name="schedule" size={18} />
                        <p className="text-body-md">
                          {a.start} – {a.end} · {a.forMemberName}
                        </p>
                      </div>
                      <div className="mt-sm flex flex-wrap items-center gap-base">
                        <ClinicBadge clinicId={a.clinicId} name={clinicName} />
                        <AppointmentStatusBadge status={a.status} />
                      </div>
                    </div>
                    <Icon name="chevron_right" className="text-outline" />
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
