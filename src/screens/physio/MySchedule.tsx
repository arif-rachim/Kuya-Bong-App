import { useMemo, useState } from 'react'
import { TopBar } from '../../components/TopBar'
import { Banner, Button, Card, EmptyState, Field, Select, Textarea } from '../../components/ui'
import { AppointmentStatusBadge, ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { PageIntro } from '../../components/PageIntro'
import { confirm } from '../../components/Confirm'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { usePhysioTherapistIds } from '../../store/selectors'
import { addDays, formatDate, formatDateShort, nowMinutes, todayISO, weekdayLabel } from '../../lib/date'
import { computeBookingOptions, uniqueStarts } from '../../lib/booking'
import type { Appointment } from '../../data/types'

export function PhysioMySchedule() {
  const myTherapistIds = usePhysioTherapistIds()
  const users = useApp((s) => s.users)
  const clinics = useApp((s) => s.clinics)
  const services = useApp((s) => s.services)
  const therapists = useApp((s) => s.therapists)
  const availability = useApp((s) => s.availability)
  const appointments = useApp((s) => s.appointments)
  const cancellationReasons = useApp((s) => s.cancellationReasons)
  const cancelApt = useApp((s) => s.cancelAppointment)
  const rescheduleApt = useApp((s) => s.rescheduleAppointment)

  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [cancelReasonId, setCancelReasonId] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [rsDate, setRsDate] = useState('')

  const mine = appointments
    .filter((a) => myTherapistIds.includes(a.therapistId))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? ''
  const patientName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'
  const serviceName = (id: string) => services.find((sv) => sv.id === id)?.name ?? '—'
  const activeReasons = cancellationReasons.filter((r) => r.active)
  const isOtherReason = activeReasons.find((r) => r.id === cancelReasonId)?.label.toLowerCase() === 'other'

  function openCancel(a: Appointment) {
    setCancelling(a)
    setCancelReasonId('')
    setCancelNote('')
  }
  function doCancel() {
    if (!cancelling) return
    if (!cancelReasonId) return toast.error('Please choose a cancellation reason.')
    const err = cancelApt(cancelling.id, 'physiotherapist', cancelReasonId, cancelNote.trim() || undefined)
    if (err) return toast.error(err)
    setCancelling(null)
    toast.success('Appointment cancelled.')
  }

  const rsService = rescheduling ? services.find((sv) => sv.id === rescheduling.serviceTypeId) : undefined
  const rsArgs = useMemo(
    () =>
      rescheduling && rsService
        ? {
            availability,
            appointments,
            therapists,
            clinicId: rescheduling.clinicId,
            durationMinutes: rsService.durationMinutes,
            therapistId: rescheduling.therapistId,
            excludeAppointmentId: rescheduling.id,
          }
        : null,
    [rescheduling, rsService, availability, appointments, therapists],
  )
  const rsDates = useMemo(() => {
    if (!rsArgs) return []
    const out: string[] = []
    for (let d = 0; d < 14; d++) {
      const day = addDays(todayISO(), d)
      if (computeBookingOptions({ ...rsArgs, date: day, minStartMin: day === todayISO() ? nowMinutes() : null }).length) out.push(day)
    }
    return out
  }, [rsArgs])
  const rsOptions = useMemo(() => {
    if (!rsArgs || !rsDate) return []
    return uniqueStarts(computeBookingOptions({ ...rsArgs, date: rsDate, minStartMin: rsDate === todayISO() ? nowMinutes() : null }))
  }, [rsArgs, rsDate])

  async function doReschedule(start: string) {
    if (!rescheduling) return
    const ok = await confirm({
      title: 'Reschedule appointment?',
      message: `Move ${patientName(rescheduling.patientUserId)} to ${formatDate(rsDate)} at ${start}?`,
      confirmLabel: 'Reschedule',
    })
    if (!ok) return
    const err = rescheduleApt(rescheduling.id, { therapistId: rescheduling.therapistId, clinicId: rescheduling.clinicId, date: rsDate, start }, 'physiotherapist')
    if (err) return toast.error(err)
    setRescheduling(null)
    setRsDate('')
    toast.success('Appointment rescheduled.')
  }

  return (
    <div className="min-h-screen">
      <TopBar title="My Schedule" />
      <div className="space-y-md px-margin-mobile py-md">
        <PageIntro>Appointments assigned to you. You can reschedule or cancel your own appointments.</PageIntro>

        {mine.length === 0 ? (
          <EmptyState icon="event_busy" title="No appointments assigned" subtitle="Assigned appointments will appear here." />
        ) : (
          mine.map((a) => {
            const actionable = a.status === 'Confirmed' || a.status === 'Rescheduled'
            return (
              <Card key={a.id} accent={a.clinicId === 'clinic-a' ? 'a' : 'b'}>
                <div className="flex items-start justify-between gap-sm">
                  <div className="min-w-0">
                    <p className="font-headline-sm text-headline-sm text-on-surface">{formatDate(a.date)}</p>
                    <p className="mt-xs text-body-md text-on-surface-variant">
                      <Icon name="schedule" size={16} /> {a.start} – {a.end} · {patientName(a.patientUserId)}
                    </p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{serviceName(a.serviceTypeId)}</p>
                    <div className="mt-sm flex flex-wrap items-center gap-xs">
                      <ClinicBadge clinicId={a.clinicId} name={clinicName(a.clinicId)} />
                      <AppointmentStatusBadge status={a.status} />
                    </div>
                  </div>
                </div>
                {actionable && (
                  <div className="mt-sm grid grid-cols-2 gap-sm">
                    <Button size="sm" variant="secondary" onClick={() => { setRescheduling(a); setRsDate('') }}>
                      <Icon name="event_repeat" size={16} /> Reschedule
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => openCancel(a)}>
                      <Icon name="cancel" size={16} /> Cancel
                    </Button>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title="Cancel Appointment">
        {cancelling && (
          <p className="mb-sm text-body-md text-on-surface-variant">
            {patientName(cancelling.patientUserId)} · {formatDate(cancelling.date)} · {cancelling.start}
          </p>
        )}
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
          <Button size="lg" variant="secondary" onClick={() => setCancelling(null)}>Keep it</Button>
        </div>
      </Modal>

      <Modal open={!!rescheduling} onClose={() => setRescheduling(null)} title="Reschedule Appointment">
        {rescheduling && (
          <p className="mb-sm text-body-md text-on-surface-variant">
            {patientName(rescheduling.patientUserId)} · {rsService?.name} · currently {formatDate(rescheduling.date)} · {rescheduling.start}
          </p>
        )}
        {rsDates.length === 0 ? (
          <EmptyState icon="event_busy" title="No open times" subtitle="No availability windows for your schedule." />
        ) : (
          <>
            <p className="mb-sm font-label-lg text-label-lg text-on-surface">Date</p>
            <div className="mb-md grid grid-cols-4 gap-base">
              {rsDates.map((d) => (
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
                      onClick={() => doReschedule(o.start)}
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
    </div>
  )
}
