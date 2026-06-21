import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, DateField, EmptyState, Field, Select, Textarea } from '../../components/ui'
import { AppointmentStatusBadge, ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { useCan } from '../../store/selectors'
import { addDays, formatDate, formatDateShort, nowMinutes, todayISO, weekdayLabel } from '../../lib/date'
import { computeBookingOptions, uniqueStarts } from '../../lib/booking'
import type { Appointment, AppointmentStatus } from '../../data/types'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'PendingApproval', label: 'Pending Approval' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Rescheduled', label: 'Rescheduled' },
  { value: 'Completed', label: 'Completed' },
  { value: 'NoShow', label: 'No-show' },
  { value: 'CancelledByAdmin', label: 'Cancelled' },
]

export function AdminAppointments() {
  const clinics = useApp((s) => s.clinics)
  const users = useApp((s) => s.users)
  const services = useApp((s) => s.services)
  const therapists = useApp((s) => s.therapists)
  const availability = useApp((s) => s.availability)
  const appointments = useApp((s) => s.appointments)
  const patientPackages = useApp((s) => s.patientPackages)
  const cancellationReasons = useApp((s) => s.cancellationReasons)
  const markCompleted = useApp((s) => s.markCompleted)
  const cancelApt = useApp((s) => s.cancelAppointment)
  const markNoShow = useApp((s) => s.markNoShow)
  const rescheduleApt = useApp((s) => s.rescheduleAppointment)
  const canManage = useCan('appointmentManagement')

  const [clinicFilter, setClinicFilter] = useState('all')
  const [therapistFilter, setTherapistFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [completing, setCompleting] = useState<Appointment | null>(null)
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [rsDate, setRsDate] = useState('')
  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [cancelReasonId, setCancelReasonId] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const list = appointments
    .filter((a) => (clinicFilter === 'all' ? true : a.clinicId === clinicFilter))
    .filter((a) => (therapistFilter === 'all' ? true : a.therapistId === therapistFilter))
    .filter((a) => (serviceFilter === 'all' ? true : a.serviceTypeId === serviceFilter))
    .filter((a) => (statusFilter === 'all' ? true : a.status === (statusFilter as AppointmentStatus)))
    .filter((a) => (dateFilter ? a.date === dateFilter : true))
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? ''
  const patientName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'
  const serviceName = (id: string) => services.find((sv) => sv.id === id)?.name ?? '—'
  const therapistName = (id: string) => therapists.find((t) => t.id === id)?.name ?? '—'
  const reasonLabel = (id: string) => cancellationReasons.find((r) => r.id === id)?.label ?? 'Cancelled'
  const activeReasons = cancellationReasons.filter((r) => r.active)
  const isOtherReason = activeReasons.find((r) => r.id === cancelReasonId)?.label.toLowerCase() === 'other'

  function complete(pkgId?: string) {
    if (!completing) return
    const err = markCompleted(completing.id, pkgId)
    if (err) return setError(err)
    setCompleting(null)
    setError(null)
    toast.success('Session marked complete.')
  }

  async function noShow(a: Appointment) {
    const ok = await confirm({
      title: 'Mark as no-show?',
      message: `Mark ${patientName(a.patientUserId)}'s ${formatDate(a.date)} ${a.start} appointment as a no-show?`,
      confirmLabel: 'Mark no-show',
    })
    if (!ok) return
    const err = markNoShow(a.id)
    if (err) return toast.error(err)
    toast.info('Marked as no-show.')
  }

  function openCancel(a: Appointment) {
    setCancelling(a)
    setCancelReasonId('')
    setCancelNote('')
  }

  function doCancel() {
    if (!cancelling) return
    if (!cancelReasonId) return toast.error('Please choose a cancellation reason.')
    const err = cancelApt(cancelling.id, 'admin', cancelReasonId, cancelNote.trim() || undefined)
    if (err) return toast.error(err)
    setCancelling(null)
    toast.success('Appointment cancelled.')
  }

  function openReschedule(a: Appointment) {
    setRescheduling(a)
    setRsDate('')
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
            patientUserId: rescheduling.patientUserId,
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
      if (computeBookingOptions({ ...rsArgs, date: day, minStartMin: day === todayISO() ? nowMinutes() : null }).length)
        out.push(day)
    }
    return out
  }, [rsArgs])

  const rsOptions = useMemo(() => {
    if (!rsArgs || !rsDate) return []
    return uniqueStarts(computeBookingOptions({ ...rsArgs, date: rsDate, minStartMin: rsDate === todayISO() ? nowMinutes() : null }))
  }, [rsArgs, rsDate])

  async function doReschedule(start: string, therapistId: string) {
    if (!rescheduling) return
    const ok = await confirm({
      title: 'Reschedule appointment?',
      message: `Move ${patientName(rescheduling.patientUserId)}'s appointment to ${formatDate(rsDate)} at ${start}?`,
      confirmLabel: 'Reschedule',
    })
    if (!ok) return
    const err = rescheduleApt(rescheduling.id, { therapistId, clinicId: rescheduling.clinicId, date: rsDate, start }, 'admin')
    if (err) return toast.error(err)
    setRescheduling(null)
    setRsDate('')
    toast.success('Appointment rescheduled.')
  }

  const completingPkgs = completing
    ? patientPackages.filter((p) => p.ownerUserId === completing.patientUserId)
    : []

  return (
    <div>
      <PageHeader title="Appointment Management" subtitle="Filter & manage bookings" />
      <div className="space-y-md p-md">
        <Card className="space-y-sm bg-surface-container-low">
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Clinic">
              <Select value={clinicFilter} onChange={(e) => setClinicFilter(e.target.value)}>
                <option value="all">All clinics</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Therapist">
              <Select value={therapistFilter} onChange={(e) => setTherapistFilter(e.target.value)}>
                <option value="all">All therapists</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Service">
            <Select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
              <option value="all">All services</option>
              {services.map((sv) => (
                <option key={sv.id} value={sv.id}>{sv.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Status">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <DateField value={dateFilter} onChange={setDateFilter} placeholder="Any date" />
            </Field>
          </div>
        </Card>

        {list.length === 0 ? (
          <EmptyState icon="event_busy" title="No appointments" subtitle="Adjust the filters above." />
        ) : (
          <div className="space-y-sm">
            {list.map((a) => {
              const actionable = canManage && (a.status === 'Confirmed' || a.status === 'Rescheduled')
              const isToday = a.date <= todayISO()
              return (
                <Card key={a.id}>
                  <div className="flex items-start gap-md">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                      <Icon name="person" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-headline-sm text-headline-sm text-primary">{patientName(a.patientUserId)}</h4>
                      {a.forMemberName !== patientName(a.patientUserId) && (
                        <p className="font-label-md text-label-md text-on-surface-variant">for: {a.forMemberName}</p>
                      )}
                      <p className="mt-xs font-label-lg text-label-lg text-on-surface">{formatDate(a.date)} · {a.start}–{a.end}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        {serviceName(a.serviceTypeId)} · {therapistName(a.therapistId)}
                      </p>
                      <div className="mt-sm flex flex-wrap gap-xs">
                        <ClinicBadge clinicId={a.clinicId} name={clinicName(a.clinicId)} />
                        <AppointmentStatusBadge status={a.status} />
                        {a.source !== 'App' && (
                          <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-highest px-sm py-xs font-label-md text-label-md text-on-surface-variant">
                            <Icon name="call" size={14} /> {a.source}
                          </span>
                        )}
                      </div>
                      {a.cancellationReasonId && (
                        <p className="mt-sm font-label-md text-label-md text-on-surface-variant">
                          <Icon name="info" size={14} /> {reasonLabel(a.cancellationReasonId)}
                          {a.cancelledBy ? ` · by ${a.cancelledBy}` : ''}
                          {a.cancellationNote ? ` — “${a.cancellationNote}”` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  {actionable && (
                    <div className="mt-md space-y-sm">
                      <Button size="sm" className="w-full" onClick={() => { setCompleting(a); setError(null) }} disabled={!isToday}>
                        <Icon name="check_circle" size={18} /> Complete Session
                      </Button>
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => openReschedule(a)}>
                        <Icon name="event_repeat" size={16} /> Reschedule
                      </Button>
                      <div className="grid grid-cols-2 gap-sm">
                        <Button size="sm" variant="secondary" onClick={() => noShow(a)}>
                          <Icon name="person_off" size={16} /> No-show
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => openCancel(a)}>
                          <Icon name="cancel" size={16} /> Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={!!completing} onClose={() => setCompleting(null)} title="Mark Session Complete">
        {error && <div className="mb-3"><Banner kind="error">{error}</Banner></div>}
        <p className="mb-3 text-on-surface-variant">Choose a package to deduct 1 session, or none.</p>
        <div className="space-y-sm">
          {completingPkgs.length === 0 && (
            <Banner kind="info">This patient has no package. The session will be recorded without deducting one.</Banner>
          )}
          {completingPkgs.length > 0 && !completingPkgs.some((p) => p.remaining > 0 && p.expiryDate >= todayISO()) && (
            <Banner kind="error">
              All of this patient's packages are expired or used up — completing won't deduct a session.
            </Banner>
          )}
          {completingPkgs.map((p) => {
            const valid = p.remaining > 0 && p.expiryDate >= todayISO()
            return (
              <button
                key={p.id}
                disabled={!valid}
                onClick={() => complete(p.id)}
                className="flex w-full items-center justify-between rounded-lg border-2 border-outline-variant p-md text-left transition-colors hover:border-primary disabled:opacity-50"
              >
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    {p.remaining} left · until {formatDate(p.expiryDate)}
                  </p>
                </div>
                {!valid && <span className="font-label-md text-label-md font-semibold text-error">invalid</span>}
              </button>
            )
          })}
          <Button size="lg" variant="secondary" onClick={() => complete(undefined)}>
            Complete without deducting a package
          </Button>
        </div>
      </Modal>

      <Modal open={!!rescheduling} onClose={() => setRescheduling(null)} title="Reschedule Appointment">
        {rescheduling && (
          <p className="mb-sm text-body-md text-on-surface-variant">
            {patientName(rescheduling.patientUserId)} · {rsService?.name} · currently {formatDate(rescheduling.date)} · {rescheduling.start}
          </p>
        )}
        {rsDates.length === 0 ? (
          <EmptyState icon="event_busy" title="No open times" subtitle="Add availability for this clinic first." />
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
    </div>
  )
}
