import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Select } from '../../components/ui'
import { AppointmentStatusBadge, ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { activePackageOf } from '../../store/selectors'
import { formatDate, formatDateShort, hoursUntil, todayISO, weekdayLabel } from '../../lib/date'
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
  const appointments = useApp((s) => s.appointments)
  const patientPackages = useApp((s) => s.patientPackages)
  const slots = useApp((s) => s.slots)
  const markCompleted = useApp((s) => s.markCompleted)
  const cancelApt = useApp((s) => s.cancelAppointment)
  const markNoShow = useApp((s) => s.markNoShow)
  const rescheduleApt = useApp((s) => s.rescheduleAppointment)

  const [clinicFilter, setClinicFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [completing, setCompleting] = useState<Appointment | null>(null)
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [rsDate, setRsDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const list = appointments
    .filter((a) => (clinicFilter === 'all' ? true : a.clinicId === clinicFilter))
    .filter((a) => (statusFilter === 'all' ? true : a.status === (statusFilter as AppointmentStatus)))
    .filter((a) => (dateFilter ? a.date === dateFilter : true))
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? ''
  const patientName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'

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

  async function cancel(a: Appointment) {
    const ok = await confirm({
      title: 'Cancel appointment?',
      message: `Cancel ${patientName(a.patientUserId)}'s ${formatDate(a.date)} ${a.start} appointment? This frees the slot.`,
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
      danger: true,
    })
    if (!ok) return
    const err = cancelApt(a.id, 'admin')
    if (err) return toast.error(err)
    toast.success('Appointment cancelled.')
  }

  function openReschedule(a: Appointment) {
    setRescheduling(a)
    setRsDate('')
  }

  async function doReschedule(newSlotId: string) {
    if (!rescheduling) return
    const slot = slots.find((s) => s.id === newSlotId)
    const ok = await confirm({
      title: 'Reschedule appointment?',
      message: slot
        ? `Move ${patientName(rescheduling.patientUserId)}'s appointment to ${formatDate(slot.date)} at ${slot.start}–${slot.end}?`
        : 'Move this appointment to the selected slot?',
      confirmLabel: 'Reschedule',
    })
    if (!ok) return
    const err = rescheduleApt(rescheduling.id, newSlotId, 'admin')
    if (err) return toast.error(err)
    setRescheduling(null)
    setRsDate('')
    toast.success('Appointment rescheduled.')
  }

  const completingPkgs = completing
    ? patientPackages.filter((p) => p.ownerUserId === completing.patientUserId)
    : []

  // Open future slots in the rescheduling appointment's clinic.
  const rsDates = rescheduling
    ? Array.from(
        new Set(
          slots
            .filter((s) => s.clinicId === rescheduling.clinicId && s.status === 'available' && hoursUntil(s.date, s.start) > 0)
            .map((s) => s.date),
        ),
      ).sort()
    : []
  const rsSlots = rescheduling
    ? slots
        .filter((s) => s.clinicId === rescheduling.clinicId && s.date === rsDate && s.status === 'available')
        .sort((a, b) => a.start.localeCompare(b.start))
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
            <Field label="Status">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Date">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface outline-none focus:border-primary transition-colors"
            />
          </Field>
        </Card>

        {list.length === 0 ? (
          <EmptyState icon="event_busy" title="No appointments" subtitle="Adjust the filters above." />
        ) : (
          <div className="space-y-sm">
            {list.map((a) => {
              const actionable = a.status === 'Confirmed' || a.status === 'Rescheduled'
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
                      <div className="mt-sm flex flex-wrap gap-xs">
                        <ClinicBadge clinicId={a.clinicId} name={clinicName(a.clinicId)} />
                        <AppointmentStatusBadge status={a.status} />
                        {a.source === 'Manual' && (
                          <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-highest px-sm py-xs font-label-md text-label-md text-on-surface-variant">
                            <Icon name="call" size={14} /> Manual
                          </span>
                        )}
                      </div>
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
                        <Button size="sm" variant="danger" onClick={() => cancel(a)}>
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
            {patientName(rescheduling.patientUserId)} · currently {formatDate(rescheduling.date)} · {rescheduling.start}
          </p>
        )}
        {rsDates.length === 0 ? (
          <EmptyState icon="event_busy" title="No open slots" subtitle="Publish slots for this clinic first." />
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
