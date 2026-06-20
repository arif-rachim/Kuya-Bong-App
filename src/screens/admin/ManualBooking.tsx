import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Card, Field, Select } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { addDays, formatDate, formatDateShort, nowMinutes, todayISO, weekdayLabel } from '../../lib/date'
import { computeBookingOptions, uniqueStarts } from '../../lib/booking'
import type { BookingSource } from '../../data/types'

export function ManualBooking() {
  const navigate = useNavigate()
  const allUsers = useApp((s) => s.users)
  const patients = allUsers.filter((u) => u.role === 'patient')
  const clinics = useApp((s) => s.clinics).filter((c) => c.active)
  const allServices = useApp((s) => s.services)
  const therapists = useApp((s) => s.therapists)
  const availability = useApp((s) => s.availability)
  const appointments = useApp((s) => s.appointments)
  const book = useApp((s) => s.bookAppointment)

  const services = allServices.filter((sv) => sv.active)
  const activeTherapists = therapists.filter((t) => t.active)

  const [patientId, setPatientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [therapistId, setTherapistId] = useState('') // '' = auto-assign
  const [clinicId, setClinicId] = useState(clinics[0]?.id ?? 'clinic-a')
  const [source, setSource] = useState<BookingSource>('Manual')
  const [date, setDate] = useState('')

  const service = services.find((sv) => sv.id === serviceId)

  const baseArgs = useMemo(
    () => ({
      availability,
      appointments,
      therapists,
      clinicId,
      durationMinutes: service?.durationMinutes ?? 0,
      patientUserId: patientId || undefined,
      therapistId: therapistId || undefined,
    }),
    [availability, appointments, therapists, clinicId, service?.durationMinutes, patientId, therapistId],
  )

  const availableDates = useMemo(() => {
    if (!service) return []
    const out: string[] = []
    for (let d = 0; d < 14; d++) {
      const day = addDays(todayISO(), d)
      if (computeBookingOptions({ ...baseArgs, date: day, minStartMin: day === todayISO() ? nowMinutes() : null }).length)
        out.push(day)
    }
    return out
  }, [baseArgs, service])

  const timeOptions = useMemo(() => {
    if (!service || !date) return []
    return uniqueStarts(computeBookingOptions({ ...baseArgs, date, minStartMin: date === todayISO() ? nowMinutes() : null }))
  }, [baseArgs, service, date])

  function bookSlot(start: string, optTherapistId: string) {
    if (!patientId) return toast.error('Please select a patient first.')
    if (!serviceId) return toast.error('Please select a service first.')
    const patient = patients.find((p) => p.id === patientId)
    const err = book({
      serviceTypeId: serviceId,
      therapistId: optTherapistId,
      clinicId,
      date,
      start,
      patientUserId: patientId,
      forMemberName: patient?.name ?? 'Patient',
      source,
    })
    if (err) return toast.error(err)
    toast.success('Manual booking created.')
    navigate('/admin/appointments')
  }

  return (
    <div>
      <PageHeader title="Manual Booking" subtitle="For phone/offline requests" back />
      <div className="space-y-md p-md">
        <Field label="Patient">
          <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">— Select patient —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-sm">
          <Field label="Service">
            <Select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setDate('') }}>
              <option value="">— Select —</option>
              {services.map((sv) => (
                <option key={sv.id} value={sv.id}>{sv.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Therapist">
            <Select value={therapistId} onChange={(e) => { setTherapistId(e.target.value); setDate('') }}>
              <option value="">Auto-assign</option>
              {activeTherapists.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Booking source">
          <Select value={source} onChange={(e) => setSource(e.target.value as BookingSource)}>
            <option value="Manual">Manual (admin)</option>
            <option value="Phone">Phone</option>
            <option value="Other">Other channel</option>
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
                  clinicId === c.id ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {!service ? (
          <p className="font-label-md text-label-md text-on-surface-variant">Select a service to see available dates.</p>
        ) : (
          <>
            <div>
              <p className="mb-base font-label-lg text-label-lg text-on-surface">Date</p>
              <div className="no-scrollbar flex gap-sm overflow-x-auto pb-1">
                {availableDates.map((d) => (
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
              {availableDates.length === 0 && (
                <p className="mt-sm font-label-md text-label-md text-on-surface-variant">No openings for this service/clinic.</p>
              )}
            </div>

            {date && (
              <Card className="overflow-hidden p-0">
                <div className="flex items-center gap-sm border-b border-outline-variant/30 bg-surface-container-low p-md">
                  <Icon name="schedule" className="text-primary" />
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{formatDate(date)}</h3>
                </div>
                <div className="grid grid-cols-2 gap-sm p-md sm:grid-cols-3">
                  {timeOptions.map((o) => (
                    <button
                      key={o.start}
                      onClick={() => bookSlot(o.start, o.therapistId)}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-outline-variant bg-surface-container-lowest py-sm font-headline-sm text-headline-sm text-on-surface transition-all hover:border-primary hover:bg-primary-container hover:text-on-primary-container"
                    >
                      <span>{o.start}</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">– {o.end}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
