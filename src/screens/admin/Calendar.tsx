import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Card } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { addDays, formatDate, formatDateShort, todayISO, weekdayLabel } from '../../lib/date'

const PRESET_TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export function AdminCalendar() {
  const clinics = useApp((s) => s.clinics)
  const slots = useApp((s) => s.slots)
  const publishSlot = useApp((s) => s.publishSlot)
  const removeSlot = useApp((s) => s.removeSlot)

  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? 'clinic-a')
  const [date, setDate] = useState(todayISO())

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(todayISO(), i)), [])

  const daySlots = slots
    .filter((s) => s.clinicId === clinicId && s.date === date)
    .sort((a, b) => a.start.localeCompare(b.start))

  const publishedTimes = new Set(daySlots.map((s) => s.start))

  function toggleTime(time: string) {
    const existing = daySlots.find((s) => s.start === time)
    if (existing) {
      const err = removeSlot(existing.id)
      if (err) return toast.error(err)
      toast.success(`Slot removed (${time}).`)
    } else {
      const err = publishSlot(clinicId, date, time)
      if (err) return toast.error(err)
      toast.success(`Slot published (${time}).`)
    }
  }

  return (
    <div>
      <PageHeader title="Availability Calendar" subtitle="Publish & manage slots" />
      <div className="space-y-md p-md">
        {/* Clinic selector */}
        <div className="flex items-center gap-xs rounded-xl border border-outline-variant bg-surface-container-low p-xs">
          {clinics.map((c) => (
            <button
              key={c.id}
              onClick={() => setClinicId(c.id)}
              className={cn(
                'flex-1 rounded-lg px-md py-sm font-label-lg text-label-lg transition-all',
                clinicId === c.id
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
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
                date === d
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface border border-outline-variant',
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
          <div className="p-md">
            <p className="mb-md font-label-md text-label-md text-on-surface-variant">
              Tap a time to publish or remove a slot. Booked slots can't be removed.
            </p>
            <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
              {PRESET_TIMES.map((t) => {
                const slot = daySlots.find((s) => s.start === t)
                const booked = slot?.status === 'booked'
                const published = publishedTimes.has(t)
                return (
                  <button
                    key={t}
                    onClick={() =>
                      booked
                        ? toast.error('This slot is booked — cancel the appointment first to free it.')
                        : toggleTime(t)
                    }
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-xs rounded-xl border-2 p-md transition-all',
                      booked
                        ? 'cursor-not-allowed border-outline-variant bg-surface-container-highest text-on-surface-variant'
                        : published
                          ? 'border-primary bg-primary-fixed text-on-primary-fixed-variant shadow-sm'
                          : 'cursor-pointer border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary',
                    )}
                  >
                    <span className="font-headline-sm text-headline-sm">{t}</span>
                    {booked ? (
                      <span className="rounded bg-outline px-2 py-0.5 font-label-md text-label-md text-surface">Booked</span>
                    ) : published ? (
                      <span className="rounded bg-primary px-2 py-0.5 font-label-md text-label-md text-on-primary">Available</span>
                    ) : (
                      <span className="rounded bg-secondary-container px-2 py-0.5 font-label-md text-label-md text-on-secondary-container">Add</span>
                    )}
                    {!booked && (
                      <Icon
                        name={published ? 'check_circle' : 'add'}
                        size={18}
                        className={cn('absolute right-2 top-2 text-primary')}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-md font-label-md text-label-md text-on-surface-variant">
          <Legend className="border-outline-variant bg-surface-container-lowest" label="Not published" />
          <Legend className="border-primary bg-primary-fixed" label="Available" />
          <Legend className="border-outline-variant bg-surface-container-highest" label="Booked" />
        </div>
      </div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-4 w-4 rounded border-2', className)} /> {label}
    </span>
  )
}
