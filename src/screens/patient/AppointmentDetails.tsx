import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { Banner, Button, Card, EmptyState, Field, Select, Textarea } from '../../components/ui'
import { AppointmentStatusBadge, ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { PageIntro } from '../../components/PageIntro'
import { confirm } from '../../components/Confirm'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { CANCEL_CUTOFF_HOURS, useApp } from '../../store/appStore'
import { useClinicName } from '../../store/selectors'
import { addDays, formatDate, formatDateShort, hoursUntil, nowMinutes, todayISO, weekdayLabel } from '../../lib/date'
import { computeBookingOptions, uniqueStarts } from '../../lib/booking'

export function AppointmentDetails() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const apt = useApp((s) => s.appointments.find((a) => a.id === id))
  const services = useApp((s) => s.services)
  const therapists = useApp((s) => s.therapists)
  const availability = useApp((s) => s.availability)
  const appointments = useApp((s) => s.appointments)
  const cancellationReasons = useApp((s) => s.cancellationReasons)
  const clinicName = useClinicName(apt?.clinicId)
  const reschedule = useApp((s) => s.rescheduleAppointment)
  const cancel = useApp((s) => s.cancelAppointment)

  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rsDate, setRsDate] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReasonId, setCancelReasonId] = useState('')
  const [cancelNote, setCancelNote] = useState('')

  const service = services.find((sv) => sv.id === apt?.serviceTypeId)
  const therapistName = therapists.find((t) => t.id === apt?.therapistId)?.name ?? '—'
  const activeReasons = cancellationReasons.filter((r) => r.active)
  const isOtherReason = activeReasons.find((r) => r.id === cancelReasonId)?.label.toLowerCase() === 'other'

  const canModify = apt && (apt.status === 'Confirmed' || apt.status === 'Rescheduled')
  // BR-05: changes are only allowed more than 24h before the session.
  const withinCutoff = apt ? hoursUntil(apt.date, apt.start) < CANCEL_CUTOFF_HOURS : false

  const rsArgs = useMemo(
    () =>
      apt && service
        ? {
            availability,
            appointments,
            therapists,
            clinicId: apt.clinicId,
            durationMinutes: service.durationMinutes,
            patientUserId: apt.patientUserId,
            excludeAppointmentId: apt.id,
          }
        : null,
    [apt, service, availability, appointments, therapists],
  )

  const availableDates = useMemo(() => {
    if (!rsArgs) return []
    const out: string[] = []
    for (let d = 0; d < 14; d++) {
      const day = addDays(todayISO(), d)
      if (computeBookingOptions({ ...rsArgs, date: day, minStartMin: day === todayISO() ? nowMinutes() : null }).length)
        out.push(day)
    }
    return out
  }, [rsArgs])

  const rsOptions = useMemo(() => {
    if (!rsArgs || !rsDate) return []
    return uniqueStarts(computeBookingOptions({ ...rsArgs, date: rsDate, minStartMin: rsDate === todayISO() ? nowMinutes() : null }))
  }, [rsArgs, rsDate])

  if (!apt) {
    return (
      <div className="min-h-screen">
        <TopBar title="Appointment Details" back />
        <EmptyState icon="event_busy" title="Appointment not found" />
      </div>
    )
  }

  async function doReschedule(start: string, therapistId: string) {
    const ok = await confirm({
      title: 'Reschedule appointment?',
      message: `Move this appointment to ${formatDate(rsDate)} at ${start}?`,
      confirmLabel: 'Reschedule',
    })
    if (!ok) return
    const err = reschedule(apt!.id, { therapistId, clinicId: apt!.clinicId, date: rsDate, start }, 'patient')
    if (err) return setModalError(err)
    setShowReschedule(false)
    setError(null)
    setModalError(null)
    toast.success('Appointment rescheduled.')
  }

  function doCancel() {
    if (!cancelReasonId) return setModalError('Please choose a cancellation reason.')
    const err = cancel(apt!.id, 'patient', cancelReasonId, cancelNote.trim() || undefined)
    if (err) return setModalError(err)
    setShowCancel(false)
    toast.success('Appointment cancelled.')
    navigate('/patient/appointments', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Appointment Details" back />
      <div className="space-y-md px-margin-mobile py-md">
        <PageIntro>
          The full details of this appointment. You can reschedule it to another open time or cancel it — both are
          allowed up to {CANCEL_CUTOFF_HOURS} hours before the session starts.
        </PageIntro>
        {error && <Banner kind="error">{error}</Banner>}

        <div className="flex justify-center">
          <AppointmentStatusBadge status={apt.status} />
        </div>

        <Card className="space-y-md" accent={apt.clinicId === 'clinic-a' ? 'a' : 'b'}>
          <DetailRow icon="medical_services" label="Service" value={service?.name ?? '—'} />
          <DetailRow icon="person_4" label="Therapist" value={therapistName} />
          <DetailRow icon="location_on" label="Clinic" value={<ClinicBadge clinicId={apt.clinicId} name={clinicName} />} />
          <DetailRow icon="calendar_month" label="Date" value={formatDate(apt.date)} />
          <DetailRow icon="schedule" label="Time" value={`${apt.start} – ${apt.end}`} />
          <DetailRow icon="person" label="For" value={apt.forMemberName} />
          {apt.cancellationReasonId && (
            <DetailRow
              icon="info"
              label="Cancelled"
              value={activeReasons.find((r) => r.id === apt.cancellationReasonId)?.label
                ?? cancellationReasons.find((r) => r.id === apt.cancellationReasonId)?.label
                ?? 'Cancelled'}
            />
          )}
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
              onClick={() => { setModalError(null); setShowReschedule(true) }}
            >
              <Icon name="event_repeat" size={20} /> Reschedule
            </Button>
            <Button
              size="lg"
              variant="danger"
              disabled={withinCutoff}
              onClick={() => { setModalError(null); setCancelReasonId(''); setCancelNote(''); setShowCancel(true) }}
            >
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

      <Modal open={showReschedule} onClose={() => setShowReschedule(false)} title="Choose a New Time">
        {modalError && <div className="mb-sm"><Banner kind="error">{modalError}</Banner></div>}
        {availableDates.length === 0 ? (
          <EmptyState icon="event_busy" title="No times available" />
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
                    rsDate === d ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant hover:border-primary',
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
                  {rsOptions.map((o) => (
                    <button
                      key={o.start}
                      onClick={() => doReschedule(o.start, o.therapistId)}
                      className="flex flex-col items-center rounded-xl border-2 border-outline-variant py-sm font-label-lg text-label-lg text-on-surface transition-colors hover:border-primary hover:bg-primary-fixed/40"
                    >
                      <span>{o.start}</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">– {o.end}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Modal>

      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel Appointment">
        {modalError && <div className="mb-sm"><Banner kind="error">{modalError}</Banner></div>}
        <p className="mb-sm text-body-md text-on-surface-variant">
          Cancelling your appointment on {formatDate(apt.date)} at {apt.start}. Please tell us why.
        </p>
        <div className="space-y-sm">
          <Field label="Cancellation reason">
            <Select value={cancelReasonId} onChange={(e) => setCancelReasonId(e.target.value)}>
              <option value="">— Select a reason —</option>
              {activeReasons.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
          </Field>
          {isOtherReason && (
            <Field label="Note">
              <Textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} placeholder="Add a short note (optional)" />
            </Field>
          )}
          <Button size="lg" variant="danger" onClick={doCancel}>Cancel appointment</Button>
          <Button size="lg" variant="secondary" onClick={() => setShowCancel(false)}>Keep it</Button>
        </div>
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
