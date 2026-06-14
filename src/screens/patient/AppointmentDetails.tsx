import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { Banner, Button, Card, EmptyState } from '../../components/ui'
import { AppointmentStatusBadge, ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { PageIntro } from '../../components/PageIntro'
import { confirm } from '../../components/Confirm'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { CANCEL_CUTOFF_HOURS, useApp } from '../../store/appStore'
import { useClinicName } from '../../store/selectors'
import { formatDate, formatDateShort, hoursUntil, weekdayLabel } from '../../lib/date'

export function AppointmentDetails() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const apt = useApp((s) => s.appointments.find((a) => a.id === id))
  const slots = useApp((s) => s.slots)
  const clinicName = useClinicName(apt?.clinicId)
  const reschedule = useApp((s) => s.rescheduleAppointment)
  const cancel = useApp((s) => s.cancelAppointment)

  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rsDate, setRsDate] = useState('')

  const canModify = apt && (apt.status === 'Confirmed' || apt.status === 'Rescheduled')
  // BR-05: changes are only allowed more than 24h before the session.
  const withinCutoff = apt ? hoursUntil(apt.date, apt.start) < CANCEL_CUTOFF_HOURS : false

  const availableDates = useMemo(() => {
    const set = new Set<string>()
    slots.forEach((s) => {
      if (s.clinicId === apt?.clinicId && s.status === 'available' && hoursUntil(s.date, s.start) > 0) set.add(s.date)
    })
    return Array.from(set).sort()
  }, [slots, apt?.clinicId])

  const rsSlots = slots
    .filter((s) => s.clinicId === apt?.clinicId && s.date === rsDate && s.status === 'available')
    .sort((a, b) => a.start.localeCompare(b.start))

  if (!apt) {
    return (
      <div className="min-h-screen">
        <TopBar title="Appointment Details" back />
        <EmptyState icon="event_busy" title="Appointment not found" />
      </div>
    )
  }

  async function doReschedule(newSlotId: string) {
    const slot = slots.find((s) => s.id === newSlotId)
    const ok = await confirm({
      title: 'Reschedule appointment?',
      message: slot
        ? `Move this appointment to ${formatDate(slot.date)} at ${slot.start}–${slot.end}?`
        : 'Move this appointment to the selected slot?',
      confirmLabel: 'Reschedule',
    })
    if (!ok) return
    const err = reschedule(apt!.id, newSlotId, 'patient')
    if (err) return setModalError(err)
    setShowReschedule(false)
    setError(null)
    setModalError(null)
    toast.success('Appointment rescheduled.')
  }

  async function doCancel() {
    const ok = await confirm({
      title: 'Cancel appointment?',
      message: `Cancel your appointment on ${formatDate(apt!.date)} at ${apt!.start}? This frees the slot for others.`,
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
      danger: true,
    })
    if (!ok) return
    const err = cancel(apt!.id, 'patient')
    if (err) return setError(err)
    toast.success('Appointment cancelled.')
    navigate('/patient/appointments', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Appointment Details" back />
      <div className="space-y-md px-margin-mobile py-md">
        <PageIntro>
          The full details of this appointment. You can reschedule it to another open slot or cancel it — both are
          allowed up to {CANCEL_CUTOFF_HOURS} hours before the session starts.
        </PageIntro>
        {error && <Banner kind="error">{error}</Banner>}

        <div className="flex justify-center">
          <AppointmentStatusBadge status={apt.status} />
        </div>

        <Card className="space-y-md" accent={apt.clinicId === 'clinic-a' ? 'a' : 'b'}>
          <DetailRow icon="location_on" label="Clinic" value={<ClinicBadge clinicId={apt.clinicId} name={clinicName} />} />
          <DetailRow icon="calendar_month" label="Date" value={formatDate(apt.date)} />
          <DetailRow icon="schedule" label="Time" value={`${apt.start} – ${apt.end}`} />
          <DetailRow icon="person" label="For" value={apt.forMemberName} />
        </Card>

        {canModify ? (
          <div className="space-y-sm">
            {withinCutoff && (
              <Banner kind="info">
                This session is less than {CANCEL_CUTOFF_HOURS} hours away, so it can no longer be rescheduled or
                cancelled. Please call the clinic for changes.
              </Banner>
            )}
            <Button
              size="lg"
              variant="secondary"
              disabled={withinCutoff}
              onClick={() => {
                setModalError(null)
                setShowReschedule(true)
              }}
            >
              <Icon name="event_repeat" size={20} /> Reschedule
            </Button>
            <Button size="lg" variant="danger" disabled={withinCutoff} onClick={doCancel}>
              <Icon name="close" size={20} /> Cancel Appointment
            </Button>
            {!withinCutoff && (
              <p className="text-center text-label-md text-on-surface-variant">
                Changes must be made more than {CANCEL_CUTOFF_HOURS} hours before the session.
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-body-md text-on-surface-variant">This appointment can't be changed.</p>
        )}
      </div>

      <Modal open={showReschedule} onClose={() => setShowReschedule(false)} title="Choose a New Slot">
        {modalError && <div className="mb-sm"><Banner kind="error">{modalError}</Banner></div>}
        {availableDates.length === 0 ? (
          <EmptyState icon="event_busy" title="No slots available" />
        ) : (
          <>
            <p className="mb-sm font-label-lg text-label-lg text-on-surface">Date</p>
            <div className="mb-md grid grid-cols-4 gap-base">
              {availableDates.map((d) => (
                <button
                  key={d}
                  onClick={() => setRsDate(d)}
                  className={cn(
                    'rounded-xl border-2 py-sm text-center transition-colors',
                    rsDate === d
                      ? 'border-primary bg-primary-fixed/40'
                      : 'border-outline-variant hover:border-primary',
                  )}
                >
                  <p className="text-label-md text-on-surface-variant">{weekdayLabel(d)}</p>
                  <p className="font-label-lg text-label-lg text-on-surface">{formatDateShort(d).split(' ')[0]}</p>
                </button>
              ))}
            </div>
            {rsDate && (
              <>
                <p className="mb-sm font-label-lg text-label-lg text-on-surface">Time</p>
                <div className="grid grid-cols-3 gap-base">
                  {rsSlots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => doReschedule(s.id)}
                      className="rounded-xl border-2 border-outline-variant py-sm font-label-lg text-label-lg text-on-surface transition-colors hover:border-primary hover:bg-primary-fixed/40"
                    >
                      {s.start}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon?: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-sm">
      {icon && <Icon name={icon} size={20} className="text-primary" />}
      <span className="text-body-md text-on-surface-variant">{label}</span>
      <span className="ml-auto font-label-lg text-label-lg text-on-surface">{value}</span>
    </div>
  )
}
