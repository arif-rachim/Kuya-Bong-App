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
import { formatDate, formatDateShort, hoursUntil, weekdayLabel } from '../../lib/date'

type Step = 'clinic' | 'date' | 'time' | 'review' | 'done'
const STEP_INDEX: Record<Step, number> = { clinic: 0, date: 1, time: 2, review: 2, done: 3 }

function slotPeriod(start: string): 'Morning' | 'Afternoon' | 'Evening' {
  const h = Number(start.slice(0, 2))
  if (h < 12) return 'Morning'
  if (h < 16) return 'Afternoon'
  return 'Evening'
}
const PERIOD_ICON = { Morning: 'light_mode', Afternoon: 'sunny', Evening: 'dark_mode' } as const

export function BookAppointment() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const profile = useCurrentProfile()
  const allClinics = useApp((s) => s.clinics)
  const slots = useApp((s) => s.slots)
  const allFamily = useApp((s) => s.family)
  const book = useApp((s) => s.bookAppointment)

  const clinics = allClinics.filter((c) => c.active)
  const family = allFamily.filter((m) => m.familyGroupId === profile?.familyGroupId && m.status === 'active')

  const [step, setStep] = useState<Step>('clinic')
  const [clinicId, setClinicId] = useState('')
  const [date, setDate] = useState('')
  const [slotId, setSlotId] = useState('')
  const [forMember, setForMember] = useState('self')
  const [error, setError] = useState<string | null>(null)

  const clinic = clinics.find((c) => c.id === clinicId)

  const availableDates = useMemo(() => {
    const set = new Set<string>()
    slots.forEach((s) => {
      if (s.clinicId === clinicId && s.status === 'available' && hoursUntil(s.date, s.start) > 0) set.add(s.date)
    })
    return Array.from(set).sort()
  }, [slots, clinicId])

  const timeSlots = useMemo(
    () =>
      slots
        .filter((s) => s.clinicId === clinicId && s.date === date && s.status === 'available' && hoursUntil(s.date, s.start) > 0)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [slots, clinicId, date],
  )
  const periods = (['Morning', 'Afternoon', 'Evening'] as const).map((p) => ({
    period: p,
    items: timeSlots.filter((s) => slotPeriod(s.start) === p),
  })).filter((g) => g.items.length)

  const slot = slots.find((s) => s.id === slotId)

  function confirm() {
    setError(null)
    const member = family.find((m) => m.id === forMember)
    const err = book({ slotId, forMemberId: member?.id, forMemberName: member?.name ?? user?.name ?? 'Patient' })
    if (err) return setError(err)
    setStep('done')
  }

  const titles: Record<Step, string> = {
    clinic: 'Choose Clinic', date: 'Select Date', time: 'Choose Time', review: 'Review Booking', done: 'Booking Confirmed',
  }
  const steps = ['Clinic', 'Date', 'Review']

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar title={titles[step]} back={step === 'clinic'} />
      <div className="px-margin-mobile py-md">
        {/* Stepper */}
        {step !== 'done' && (
          <div className="mb-lg">
            <div className="mb-sm flex justify-between">
              <span className="font-label-lg text-label-lg text-primary">
                Step {Math.min(STEP_INDEX[step] + 1, 3)} of 3
              </span>
              <span className="font-label-lg text-label-lg text-outline">{steps[Math.min(STEP_INDEX[step], 2)]}</span>
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
              Book in three quick steps — pick a clinic, choose a date, then tap an open time. You'll review everything
              before it's confirmed.
            </PageIntro>
          </div>
        )}

        {step === 'clinic' && (
          <div className="space-y-md">
            <p className="text-body-lg text-on-surface-variant">Choose the clinic most convenient for you.</p>
            {clinics.map((c) => (
              <button
                key={c.id}
                onClick={() => { setClinicId(c.id); setStep('date') }}
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
            <div className="mb-md"><ClinicBadge clinicId={clinicId} name={clinic?.name ?? ''} /></div>
            {availableDates.length === 0 ? (
              <EmptyState icon="event_busy" title="No slots available" subtitle="Try another clinic or period." />
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
              <EmptyState icon="schedule" title="No slots left for this date" subtitle="Choose another date." />
            ) : (
              periods.map(({ period, items }) => (
                <div key={period} className="space-y-sm">
                  <div className="flex items-center gap-xs text-primary">
                    <Icon name={PERIOD_ICON[period]} size={20} />
                    <h2 className="font-headline-sm text-headline-sm">{period}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-sm">
                    {items.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSlotId(s.id); setStep('review') }}
                        className="flex h-14 items-center justify-center rounded-xl border-2 border-outline-variant font-label-lg text-on-surface transition hover:bg-surface-container-high active:scale-95"
                      >
                        {s.start}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step === 'review' && slot && (
          <div className="space-y-md">
            <div className="space-y-sm rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">Booking Summary</h3>
              <SummaryRow icon="location_on" tint="bg-primary-fixed text-on-primary-fixed" label="Clinic" value={clinic?.name ?? ''} />
              <SummaryRow icon="calendar_today" tint="bg-secondary-fixed text-on-secondary-fixed" label="Date" value={formatDate(slot.date)} />
              <SummaryRow icon="schedule" tint="bg-tertiary-fixed text-on-tertiary-fixed" label="Time" value={`${slot.start} – ${slot.end}`} />
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

        {step === 'done' && slot && (
          <div className="flex flex-col items-center py-lg text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icon name="check_circle" className="text-5xl" fill />
            </div>
            <h2 className="mt-md font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Booking Confirmed!</h2>
            <p className="mt-xs text-body-md text-on-surface-variant">See you at the clinic.</p>
            <div className="mt-lg w-full space-y-sm rounded-xl border border-outline-variant/30 bg-surface-container-low p-md text-left">
              <SummaryRow icon="location_on" tint="bg-primary-fixed text-on-primary-fixed" label="Clinic" value={clinic?.name ?? ''} />
              <SummaryRow icon="calendar_today" tint="bg-secondary-fixed text-on-secondary-fixed" label="Date" value={formatDate(slot.date)} />
              <SummaryRow icon="schedule" tint="bg-tertiary-fixed text-on-tertiary-fixed" label="Time" value={`${slot.start} – ${slot.end}`} />
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
