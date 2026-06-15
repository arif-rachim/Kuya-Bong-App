import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { TopBar } from '../../components/TopBar'
import { Banner, Button, EmptyState, Field, Select } from '../../components/ui'
import { PageIntro } from '../../components/PageIntro'
import { ClinicBadge } from '../../components/StatusBadge'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { useCurrentProfile, useCurrentUser } from '../../store/selectors'
import { addDays, formatDate, formatDateShort, todayISO, nowMinutes, weekdayLabel } from '../../lib/date'
import { computeBookingOptions, uniqueStarts, type BookingOption } from '../../lib/booking'

type Step = 'service' | 'clinic' | 'date' | 'time' | 'review' | 'done'
const STEP_INDEX: Record<Step, number> = { service: 0, clinic: 1, date: 2, time: 3, review: 3, done: 4 }

function slotPeriod(start: string): 'Morning' | 'Afternoon' | 'Evening' {
  const h = Number(start.slice(0, 2))
  if (h < 12) return 'Morning'
  if (h < 16) return 'Afternoon'
  return 'Evening'
}
const PERIOD_ICON = { Morning: 'light_mode', Afternoon: 'sunny', Evening: 'dark_mode' } as const

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function BookAppointment() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const profile = useCurrentProfile()
  const allClinics = useApp((s) => s.clinics)
  const allServices = useApp((s) => s.services)
  const therapists = useApp((s) => s.therapists)
  const availability = useApp((s) => s.availability)
  const appointments = useApp((s) => s.appointments)
  const allFamily = useApp((s) => s.family)
  const book = useApp((s) => s.bookAppointment)

  const clinics = allClinics.filter((c) => c.active)
  const services = allServices.filter((sv) => sv.active)
  const family = allFamily.filter((m) => m.familyGroupId === profile?.familyGroupId && m.status === 'active')

  const [step, setStep] = useState<Step>('service')
  const [serviceId, setServiceId] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [date, setDate] = useState('')
  const [picked, setPicked] = useState<BookingOption | null>(null)
  const [forMember, setForMember] = useState('self')
  const [error, setError] = useState<string | null>(null)

  const clinic = clinics.find((c) => c.id === clinicId)
  const service = services.find((sv) => sv.id === serviceId)
  const therapistName = (id: string) => therapists.find((t) => t.id === id)?.name ?? '—'

  const baseArgs = useMemo(
    () => ({ availability, appointments, therapists, clinicId, durationMinutes: service?.durationMinutes ?? 0, patientUserId: user?.id }),
    [availability, appointments, therapists, clinicId, service?.durationMinutes, user?.id],
  )

  const availableDates = useMemo(() => {
    if (!service || !clinicId) return []
    const out: string[] = []
    for (let d = 0; d < 14; d++) {
      const day = addDays(todayISO(), d)
      const opts = computeBookingOptions({ ...baseArgs, date: day, minStartMin: day === todayISO() ? nowMinutes() : null })
      if (opts.length) out.push(day)
    }
    return out
  }, [baseArgs, service, clinicId])

  const timeOptions = useMemo(() => {
    if (!service || !date) return []
    return uniqueStarts(computeBookingOptions({ ...baseArgs, date, minStartMin: date === todayISO() ? nowMinutes() : null }))
  }, [baseArgs, service, date])

  const periods = (['Morning', 'Afternoon', 'Evening'] as const)
    .map((p) => ({ period: p, items: timeOptions.filter((o) => slotPeriod(o.start) === p) }))
    .filter((g) => g.items.length)

  function confirm() {
    setError(null)
    if (!picked) return
    const member = family.find((m) => m.id === forMember)
    const err = book({
      serviceTypeId: serviceId,
      therapistId: picked.therapistId,
      clinicId,
      date,
      start: picked.start,
      forMemberId: member?.id,
      forMemberName: member?.name ?? user?.name ?? 'Patient',
    })
    if (err) return setError(err)
    setStep('done')
  }

  const titles: Record<Step, string> = {
    service: 'Choose Service', clinic: 'Choose Clinic', date: 'Select Date', time: 'Choose Time', review: 'Review Booking', done: 'Booking Confirmed',
  }
  const steps = ['Service', 'Clinic', 'Date', 'Review']

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar title={titles[step]} back={step === 'service'} />
      <div className="px-margin-mobile py-md">
        {/* Stepper */}
        {step !== 'done' && (
          <div className="mb-lg">
            <div className="mb-sm flex justify-between">
              <span className="font-label-lg text-label-lg text-primary">
                Step {Math.min(STEP_INDEX[step] + 1, 4)} of 4
              </span>
              <span className="font-label-lg text-label-lg text-outline">{steps[Math.min(STEP_INDEX[step], 3)]}</span>
            </div>
            <div className="flex gap-xs">
              {steps.map((_, i) => (
                <div key={i} className={cn('h-2 flex-1 rounded-full', i <= STEP_INDEX[step] ? 'bg-primary' : 'bg-surface-container-highest')} />
              ))}
            </div>
          </div>
        )}

        {error && <div className="mb-md"><Banner kind="error">{error}</Banner></div>}

        {step !== 'done' && (
          <div className="mb-md">
            <PageIntro>
              Pick a service, choose a clinic and date, then tap an open time. Available times already account for the
              service duration and therapist availability — you'll review everything before confirming.
            </PageIntro>
          </div>
        )}

        {step === 'service' && (
          <div className="space-y-md">
            <p className="text-body-lg text-on-surface-variant">What treatment do you need?</p>
            {services.length === 0 ? (
              <EmptyState icon="medical_services" title="No services available" subtitle="Please check back later." />
            ) : (
              services.map((sv) => (
                <button
                  key={sv.id}
                  onClick={() => { setServiceId(sv.id); setClinicId(''); setDate(''); setPicked(null); setStep('clinic') }}
                  className="flex w-full items-center justify-between gap-sm rounded-xl border-2 border-transparent bg-surface-container-lowest p-md text-left shadow-soft transition hover:border-primary"
                >
                  <div className="min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">{sv.name}</h3>
                    <p className="text-body-md text-on-surface-variant">
                      <Icon name="schedule" size={16} /> {formatDuration(sv.durationMinutes)}
                    </p>
                  </div>
                  <Icon name="chevron_right" className="text-on-surface-variant" />
                </button>
              ))
            )}
          </div>
        )}

        {step === 'clinic' && (
          <div className="space-y-md">
            <button onClick={() => setStep('service')} className="inline-flex items-center gap-xs font-label-lg text-primary">
              <Icon name="arrow_back" size={18} /> Change service
            </button>
            <p className="text-body-lg text-on-surface-variant">Choose the clinic most convenient for you.</p>
            {clinics.map((c) => (
              <button
                key={c.id}
                onClick={() => { setClinicId(c.id); setDate(''); setPicked(null); setStep('date') }}
                className="w-full rounded-xl border-2 border-transparent bg-surface-container-lowest p-md text-left shadow-soft transition hover:border-primary"
              >
                <div className="mb-sm flex items-center justify-between">
                  <ClinicBadge clinicId={c.id} name={c.id === 'clinic-a' ? 'Clinic A' : 'Clinic B'} />
                  <Icon name="chevron_right" className="text-on-surface-variant" />
                </div>
                <div className={cn('pl-md', c.id === 'clinic-a' ? 'border-l-4 border-clinic-a' : 'border-l-4 border-clinic-b')}>
                  <h3 className={cn('font-headline-sm text-headline-sm', c.id === 'clinic-a' ? 'text-clinic-a' : 'text-clinic-b')}>{c.name}</h3>
                  <p className="text-body-md text-on-surface-variant">{c.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'date' && (
          <div>
            <button onClick={() => setStep('clinic')} className="mb-md inline-flex items-center gap-xs font-label-lg text-primary">
              <Icon name="arrow_back" size={18} /> Change clinic
            </button>
            <div className="mb-md flex flex-wrap items-center gap-xs">
              <ClinicBadge clinicId={clinicId} name={clinic?.name ?? ''} />
              {service && (
                <span className="inline-flex items-center gap-xs rounded-full bg-secondary-container px-sm py-xs font-label-md text-label-md text-on-secondary-container">
                  <Icon name="medical_services" size={14} /> {service.name} · {formatDuration(service.durationMinutes)}
                </span>
              )}
            </div>
            {availableDates.length === 0 ? (
              <EmptyState icon="event_busy" title="No openings" subtitle="Try another clinic or service." />
            ) : (
              <div className="grid grid-cols-4 gap-sm">
                {availableDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDate(d); setStep('time') }}
                    className="rounded-xl border border-outline-variant bg-surface-container-lowest py-sm text-center transition hover:border-primary hover:bg-secondary-container"
                  >
                    <p className="font-label-md text-label-md text-on-surface-variant">{weekdayLabel(d)}</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">{formatDateShort(d).split(' ')[0]}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{formatDateShort(d).split(' ')[1]}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'time' && (
          <div className="space-y-md">
            <button onClick={() => setStep('date')} className="inline-flex items-center gap-xs font-label-lg text-primary">
              <Icon name="arrow_back" size={18} /> Change date
            </button>
            <p className="font-headline-sm text-headline-sm text-on-surface">{formatDate(date)}</p>
            {periods.length === 0 ? (
              <EmptyState icon="schedule" title="No times left for this date" subtitle="Choose another date." />
            ) : (
              periods.map(({ period, items }) => (
                <div key={period} className="space-y-sm">
                  <div className="flex items-center gap-xs text-primary">
                    <Icon name={PERIOD_ICON[period]} size={20} />
                    <h2 className="font-headline-sm text-headline-sm">{period}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-sm">
                    {items.map((o) => (
                      <button
                        key={o.start}
                        onClick={() => { setPicked(o); setStep('review') }}
                        className="flex h-16 flex-col items-center justify-center rounded-xl border-2 border-outline-variant font-label-lg text-on-surface transition hover:bg-surface-container-high active:scale-95"
                      >
                        <span className="font-headline-sm text-headline-sm">{o.start}</span>
                        <span className="font-label-md text-label-md text-on-surface-variant">– {o.end}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step === 'review' && picked && (
          <div className="space-y-md">
            <div className="space-y-sm rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">Booking Summary</h3>
              <SummaryRow icon="medical_services" tint="bg-secondary-fixed text-on-secondary-fixed" label="Service" value={service?.name ?? ''} />
              <SummaryRow icon="person" tint="bg-tertiary-fixed text-on-tertiary-fixed" label="Therapist" value={therapistName(picked.therapistId)} />
              <SummaryRow icon="location_on" tint="bg-primary-fixed text-on-primary-fixed" label="Clinic" value={clinic?.name ?? ''} />
              <SummaryRow icon="calendar_today" tint="bg-secondary-fixed text-on-secondary-fixed" label="Date" value={formatDate(date)} />
              <SummaryRow icon="schedule" tint="bg-tertiary-fixed text-on-tertiary-fixed" label="Time" value={`${picked.start} – ${picked.end}`} />
            </div>

            {family.length > 0 && (
              <Field label="Treatment for">
                <Select value={forMember} onChange={(e) => setForMember(e.target.value)}>
                  <option value="self">{user?.name} (me)</option>
                  {family.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.isChild ? 'child' : 'family'})</option>
                  ))}
                </Select>
              </Field>
            )}

            <Button size="lg" onClick={confirm}>Confirm Booking</Button>
          </div>
        )}

        {step === 'done' && picked && (
          <div className="flex flex-col items-center py-lg text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icon name="check_circle" className="text-5xl" fill />
            </div>
            <h2 className="mt-md font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Booking Confirmed!</h2>
            <p className="mt-xs text-body-md text-on-surface-variant">See you at the clinic.</p>
            <div className="mt-lg w-full space-y-sm rounded-xl border border-outline-variant/30 bg-surface-container-low p-md text-left">
              <SummaryRow icon="medical_services" tint="bg-secondary-fixed text-on-secondary-fixed" label="Service" value={service?.name ?? ''} />
              <SummaryRow icon="person" tint="bg-tertiary-fixed text-on-tertiary-fixed" label="Therapist" value={therapistName(picked.therapistId)} />
              <SummaryRow icon="location_on" tint="bg-primary-fixed text-on-primary-fixed" label="Clinic" value={clinic?.name ?? ''} />
              <SummaryRow icon="calendar_today" tint="bg-secondary-fixed text-on-secondary-fixed" label="Date" value={formatDate(date)} />
              <SummaryRow icon="schedule" tint="bg-tertiary-fixed text-on-tertiary-fixed" label="Time" value={`${picked.start} – ${picked.end}`} />
            </div>
            <div className="mt-lg w-full space-y-sm">
              <Button size="lg" onClick={() => navigate('/patient/appointments')}>View My Appointments</Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/patient/home')}>Back to Home</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ icon, tint, label, value }: { icon: string; tint: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-base">
      <div className={cn('rounded-lg p-xs', tint)}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p className="font-label-lg text-label-lg text-outline">{label}</p>
        <p className="font-headline-sm text-headline-sm text-on-surface">{value}</p>
      </div>
    </div>
  )
}
