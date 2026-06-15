/**
 * Duration-aware booking engine (blueprint v0.3 Section 25).
 *
 * Availability is modelled as therapist working windows. Valid booking start
 * times are computed from the selected service duration, and conflicts are
 * checked against therapist and patient schedules (BR-20..BR-26 renumbered).
 */
import type { Appointment, Therapist, TherapistAvailability } from '../data/types'

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function addMinutes(t: string, mins: number): string {
  return minToTime(timeToMin(t) + mins)
}

/** Two half-open ranges [s1,e1) and [s2,e2) overlap. */
export function rangesOverlap(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && s2 < e1
}

/** Statuses that occupy a therapist's / patient's time (so they block new bookings). */
export const BUSY_STATUSES: Appointment['status'][] = ['PendingApproval', 'Confirmed', 'Rescheduled', 'Completed']

export interface BookingOption {
  start: string
  end: string
  therapistId: string
}

interface ConflictArgs {
  appointments: Appointment[]
  therapistId: string
  patientUserId?: string
  date: string
  start: string
  end: string
  excludeAppointmentId?: string
}

/**
 * Returns a human-readable conflict reason, or null when the time is free.
 * Therapist conflicts apply across clinics; patient conflicts apply across any
 * clinic, therapist, or service.
 */
export function findConflict({
  appointments,
  therapistId,
  patientUserId,
  date,
  start,
  end,
  excludeAppointmentId,
}: ConflictArgs): string | null {
  const s = timeToMin(start)
  const e = timeToMin(end)
  for (const a of appointments) {
    if (a.id === excludeAppointmentId) continue
    if (a.date !== date) continue
    if (!BUSY_STATUSES.includes(a.status)) continue
    if (!rangesOverlap(s, e, timeToMin(a.start), timeToMin(a.end))) continue
    if (a.therapistId === therapistId)
      return 'The selected therapist is already booked for an overlapping time.'
    if (patientUserId && a.patientUserId === patientUserId)
      return 'This patient already has an appointment that overlaps this time.'
  }
  return null
}

interface ComputeArgs {
  availability: TherapistAvailability[]
  appointments: Appointment[]
  therapists: Therapist[]
  clinicId: string
  date: string
  durationMinutes: number
  patientUserId?: string
  /** Restrict to a single therapist (admin assignment). */
  therapistId?: string
  excludeAppointmentId?: string
  stepMinutes?: number
  /** Minutes-since-midnight floor (for "today"); starts before are excluded. */
  minStartMin?: number | null
}

/** All valid (start, end, therapist) options at a clinic + date for a service duration. */
export function computeBookingOptions(args: ComputeArgs): BookingOption[] {
  const {
    availability,
    appointments,
    therapists,
    clinicId,
    date,
    durationMinutes,
    patientUserId,
    therapistId,
    excludeAppointmentId,
    stepMinutes = 30,
    minStartMin = null,
  } = args
  if (durationMinutes <= 0) return []
  const activeTherapistIds = new Set(
    therapists.filter((t) => t.active && (!therapistId || t.id === therapistId)).map((t) => t.id),
  )
  const windows = availability.filter(
    (w) => w.clinicId === clinicId && w.date === date && activeTherapistIds.has(w.therapistId),
  )
  const options: BookingOption[] = []
  for (const w of windows) {
    const wStart = timeToMin(w.start)
    const wEnd = timeToMin(w.end)
    for (let s = wStart; s + durationMinutes <= wEnd; s += stepMinutes) {
      if (minStartMin != null && s < minStartMin) continue
      const start = minToTime(s)
      const end = minToTime(s + durationMinutes)
      if (findConflict({ appointments, therapistId: w.therapistId, patientUserId, date, start, end, excludeAppointmentId }))
        continue
      options.push({ start, end, therapistId: w.therapistId })
    }
  }
  return options
}

/** Collapse options to unique start times (earliest therapist wins), sorted by time. */
export function uniqueStarts(options: BookingOption[]): BookingOption[] {
  const byStart = new Map<string, BookingOption>()
  const sorted = [...options].sort(
    (a, b) => a.start.localeCompare(b.start) || a.therapistId.localeCompare(b.therapistId),
  )
  for (const o of sorted) if (!byStart.has(o.start)) byStart.set(o.start, o)
  return Array.from(byStart.values()).sort((a, b) => a.start.localeCompare(b.start))
}
