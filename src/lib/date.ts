/** Simple date utilities (ISO strings `YYYY-MM-DD` and times `HH:mm`). */

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00')
}

export function addDays(iso: string, days: number): string {
  const d = isoToDate(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function addMonths(iso: string, months: number): string {
  const d = isoToDate(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDate(iso: string): string {
  const d = isoToDate(iso)
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(iso: string): string {
  const d = isoToDate(iso)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

/** Compact, space-saving format: DD-MMM-YY (e.g. 21-Jun-26). */
export function formatDateCompact(iso: string): string {
  if (!iso) return ''
  const d = isoToDate(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${day}-${MONTH_NAMES[d.getMonth()]}-${yy}`
}

export function weekdayLabel(iso: string): string {
  return DAY_NAMES[isoToDate(iso).getDay()]
}

export function dayOfMonth(iso: string): number {
  return isoToDate(iso).getDate()
}

/** Whether `iso` (a date) is in the past relative to today. */
export function isPastDate(iso: string): boolean {
  return iso < todayISO()
}

/** First day of the current month as an ISO date (YYYY-MM-01). */
export function firstOfMonthISO(): string {
  return todayISO().slice(0, 8) + '01'
}

/** Hours between now and a date + time. Negative if already past. */
export function hoursUntil(dateISO: string, timeHHmm: string): number {
  const target = new Date(`${dateISO}T${timeHHmm}:00`).getTime()
  return (target - Date.now()) / 36e5
}

/** Current local time as minutes since midnight (e.g. 09:30 -> 570). */
export function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function formatPrice(value: number): string {
  return '$' + value.toLocaleString('en-US')
}
