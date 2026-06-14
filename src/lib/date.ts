/** Util tanggal sederhana (string ISO `YYYY-MM-DD` dan jam `HH:mm`). */

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

export function weekdayLabel(iso: string): string {
  return DAY_NAMES[isoToDate(iso).getDay()]
}

export function dayOfMonth(iso: string): number {
  return isoToDate(iso).getDate()
}

/** Apakah `iso` (tanggal) sudah lewat dibanding hari ini. */
export function isPastDate(iso: string): boolean {
  return iso < todayISO()
}

/** Selisih jam antara sekarang dan slot (date + time). Negatif jika sudah lewat. */
export function hoursUntil(dateISO: string, timeHHmm: string): number {
  const target = new Date(`${dateISO}T${timeHHmm}:00`).getTime()
  return (target - Date.now()) / 36e5
}

export function formatPrice(value: number): string {
  return '$' + value.toLocaleString('en-US')
}
