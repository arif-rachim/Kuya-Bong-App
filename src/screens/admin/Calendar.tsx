import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Button, Card, EmptyState, Field, Select } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { addDays, formatDate, formatDateShort, todayISO, weekdayLabel } from '../../lib/date'
import { timeToMin } from '../../lib/booking'

// 08:00 → 19:00 in 30-minute steps for the start/end pickers.
const TIME_OPTIONS = Array.from({ length: 23 }, (_, i) => {
  const min = 8 * 60 + i * 30
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
})

export function AdminCalendar() {
  const clinics = useApp((s) => s.clinics).filter((c) => c.active)
  const allTherapists = useApp((s) => s.therapists)
  const availability = useApp((s) => s.availability)
  const publishAvailability = useApp((s) => s.publishAvailability)
  const removeAvailability = useApp((s) => s.removeAvailability)

  const therapists = allTherapists.filter((t) => t.active)
  const [therapistId, setTherapistId] = useState(therapists[0]?.id ?? '')
  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? 'clinic-a')
  const [date, setDate] = useState(todayISO())
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i)), [])

  const windows = availability
    .filter((w) => w.therapistId === therapistId && w.clinicId === clinicId && w.date === date)
    .sort((a, b) => a.start.localeCompare(b.start))

  function addWindow() {
    if (!therapistId) return toast.error('Add a therapist first (Settings → Therapists).')
    const err = publishAvailability({ therapistId, clinicId, date, start, end })
    if (err) return toast.error(err)
    toast.success(`Availability added (${start}–${end}).`)
  }

  function remove(id: string, label: string) {
    const err = removeAvailability(id)
    if (err) return toast.error(err)
    toast.success(`Availability removed (${label}).`)
  }

  return (
    <div>
      <PageHeader title="Availability Calendar" subtitle="Publish therapist working windows" />
      <div className="space-y-md p-md">
        {therapists.length === 0 ? (
          <EmptyState icon="person_off" title="No active therapists" subtitle="Add a therapist in Settings → Therapists first." />
        ) : (
          <>
            <Field label="Therapist">
              <Select value={therapistId} onChange={(e) => setTherapistId(e.target.value)}>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>

            {/* Clinic selector */}
            <div className="flex items-center gap-xs rounded-xl border border-outline-variant bg-surface-container-low p-xs">
              {clinics.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClinicId(c.id)}
                  className={cn(
                    'flex-1 rounded-lg px-md py-sm font-label-lg text-label-lg transition-all',
                    clinicId === c.id ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Date strip */}
            <div className="no-scrollbar flex gap-sm overflow-x-auto pb-1">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={cn(
                    'min-w-[56px] rounded-xl py-sm text-center transition-colors',
                    date === d ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface border border-outline-variant',
                  )}
                >
                  <p className={cn('font-label-md text-label-md', date === d ? 'text-on-primary/80' : 'text-on-surface-variant')}>{weekdayLabel(d)}</p>
                  <p className="font-headline-sm text-headline-sm">{formatDateShort(d).split(' ')[0]}</p>
                </button>
              ))}
            </div>

            <Card className="overflow-hidden p-0">
              <div className="flex items-center gap-sm border-b border-outline-variant/30 bg-surface-container-low p-md">
                <Icon name="schedule" className="text-primary" />
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{formatDate(date)}</h3>
              </div>
              <div className="space-y-sm p-md">
                {windows.length === 0 ? (
                  <p className="font-label-md text-label-md text-on-surface-variant">No working window yet for this day.</p>
                ) : (
                  windows.map((w) => (
                    <div key={w.id} className="flex items-center justify-between gap-sm rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-md py-sm">
                      <span className="inline-flex items-center gap-xs font-label-lg text-label-lg text-on-surface">
                        <Icon name="check_circle" size={18} fill className="text-primary" /> {w.start} – {w.end}
                      </span>
                      <button
                        onClick={() => remove(w.id, `${w.start}–${w.end}`)}
                        aria-label="Remove window"
                        className="rounded-full p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                      >
                        <Icon name="delete" size={20} />
                      </button>
                    </div>
                  ))
                )}

                <div className="grid grid-cols-2 gap-sm pt-sm">
                  <Field label="From">
                    <Select value={start} onChange={(e) => setStart(e.target.value)}>
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </Field>
                  <Field label="To">
                    <Select value={end} onChange={(e) => setEnd(e.target.value)}>
                      {TIME_OPTIONS.filter((t) => timeToMin(t) > timeToMin(start)).map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </Field>
                </div>
                <Button size="sm" className="w-full" onClick={addWindow}>
                  <Icon name="add" size={16} /> Add availability window
                </Button>
              </div>
            </Card>

            <p className="px-xs font-label-md text-label-md text-on-surface-variant">
              Patients can book any service that fits inside a window. The booking engine prevents therapist and patient
              conflicts automatically.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
