import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Card, Field, Select } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { formatDate, formatDateShort, hoursUntil, weekdayLabel } from '../../lib/date'

export function ManualBooking() {
  const navigate = useNavigate()
  const allUsers = useApp((s) => s.users)
  const patients = allUsers.filter((u) => u.role === 'patient')
  const clinics = useApp((s) => s.clinics)
  const slots = useApp((s) => s.slots)
  const book = useApp((s) => s.bookAppointment)

  const [patientId, setPatientId] = useState('')
  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? 'clinic-a')
  const [date, setDate] = useState('')

  const availableDates = useMemo(() => {
    const set = new Set<string>()
    slots.forEach((s) => {
      if (s.clinicId === clinicId && s.status === 'available' && hoursUntil(s.date, s.start) > 0) set.add(s.date)
    })
    return Array.from(set).sort()
  }, [slots, clinicId])

  const timeSlots = slots
    .filter((s) => s.clinicId === clinicId && s.date === date && s.status === 'available')
    .sort((a, b) => a.start.localeCompare(b.start))

  function bookSlot(slotId: string) {
    if (!patientId) return toast.error('Please select a patient first.')
    const patient = patients.find((p) => p.id === patientId)
    const err = book({
      slotId,
      patientUserId: patientId,
      forMemberName: patient?.name ?? 'Patient',
      source: 'Manual',
    })
    if (err) return toast.error(err)
    toast.success('Manual booking created.')
    navigate('/admin/appointments')
  }

  return (
    <div>
      <PageHeader title="Manual Booking" subtitle="For phone/DM requests" back />
      <div className="space-y-md p-md">
        <Field label="Patient">
          <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">— Select patient —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="mb-base font-label-lg text-label-lg text-on-surface">Clinic</p>
          <div className="flex items-center gap-xs rounded-xl border border-outline-variant bg-surface-container-low p-xs">
            {clinics.map((c) => (
              <button
                key={c.id}
                onClick={() => { setClinicId(c.id); setDate('') }}
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
        </div>

        <div>
          <p className="mb-base font-label-lg text-label-lg text-on-surface">Date</p>
          <div className="no-scrollbar flex gap-sm overflow-x-auto pb-1">
            {availableDates.map((d) => (
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
        </div>

        {date && (
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-sm border-b border-outline-variant/30 bg-surface-container-low p-md">
              <Icon name="schedule" className="text-primary" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{formatDate(date)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-sm p-md sm:grid-cols-3">
              {timeSlots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => bookSlot(s.id)}
                  className="flex items-center justify-center rounded-xl border-2 border-outline-variant bg-surface-container-lowest py-md font-headline-sm text-headline-sm text-on-surface transition-all hover:border-primary hover:bg-primary-container hover:text-on-primary-container"
                >
                  {s.start}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
