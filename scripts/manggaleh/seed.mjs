/**
 * Seed the shared/catalog collections in manggaleh (admin / service key).
 * Run with the SERVICE key in an env var (never commit it):
 *   MANGGALEH_SERVICE_KEY=mgsk_xxx node scripts/manggaleh/seed.mjs
 *
 * Idempotent-ish: skips if `clinics` already has rows.
 */
import { createClient } from '@manggaleh/sdk'

const key = process.env.MANGGALEH_SERVICE_KEY
if (!key) { console.error('Set MANGGALEH_SERVICE_KEY'); process.exit(1) }

const c = createClient({
  baseUrl: process.env.MANGGALEH_BASE_URL ?? 'https://api.manggaleh.com',
  tenant: process.env.MANGGALEH_TENANT ?? 'realief-expert',
  env: process.env.MANGGALEH_ENV ?? 'dev',
  apiKey: key,
})

const today = new Date()
const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d) }
const ins = (coll, row) => c.data.from(coll).insert(row)

const existing = await c.data.from('clinics').list({ limit: 1 }).catch(() => [])
if (existing.length) { console.log('clinics already seeded — aborting to avoid duplicates.'); process.exit(0) }

// --- clinics ---
const clinicA = await ins('clinics', { name: 'Clinic A', address: 'Jumeirah Beach Rd 12, Dubai', contact: '', active: true })
const clinicB = await ins('clinics', { name: 'Clinic B', address: 'Al Falah St 88, Abu Dhabi', contact: '', active: true })

// --- service types ---
const svcPhysio = await ins('service_types', { name: 'Physiotherapy & Massage', duration_minutes: 180, active: true })
const svcGround = await ins('service_types', { name: 'Grounding Machine Therapy', duration_minutes: 120, active: true })

// --- therapists (Dr. Lina's user link is set later, after auth users exist) ---
const thBong = await ins('therapists', { name: 'Kuya Bong', active: true })
const thLina = await ins('therapists', { name: 'Dr. Lina', active: true })

// --- cancellation reasons ---
for (const label of ['Patient is not available', 'Patient is sick', 'Emergency', 'Booked wrong clinic', 'Booked wrong date or time', 'Other'])
  await ins('cancellation_reasons', { label, active: true })

// --- package definitions ---
await ins('package_definitions', { name: '6-Session Package', sessions: 6, validity_days: 90 })
await ins('package_definitions', { name: '10-Session Package', sessions: 10, validity_days: 180 })

// --- products ---
await ins('products', { name: 'Herbal Joint Relief', category: 'herbal', price: 450, active: true, notes: 'For joint pain' })
await ins('products', { name: 'Magnesium Complex', category: 'supplement', price: 380, active: true })
await ins('products', { name: 'Muscle Recovery Balm', category: 'herbal', price: 250, active: true })
await ins('products', { name: 'Old Tonic (discontinued)', category: 'other', price: 200, active: false })

// --- announcements ---
await ins('announcements', { title: 'Buy One Get One Free', message: 'This week only: buy any herbal product and get a second one free. Ask Kuya at your next visit!', expiry_date: addDays(12), published: true })
await ins('announcements', { title: 'Clinic B Maintenance', message: 'Clinic B will be closed for maintenance next Monday. Please book at Clinic A for that day.', expiry_date: addDays(6), published: true })

// --- sub-admin permission profile (singleton) ---
await ins('sub_admin_permissions', {
  key: 'default',
  manage_booking: true, appointment_management: true, manage_clinics: false, manage_therapists: false,
  manage_patients: true, manage_products: true, manage_services: false, manage_cancellation_reasons: false,
  manage_announcements: true, manage_follow_up: true, reports_services: true, reports_products: true,
})

// --- therapist availability for the next 14 days ---
let windows = 0
for (let d = 0; d < 14; d++) {
  const date = addDays(d)
  await ins('therapist_availability', { therapist_id: thBong.id, clinic_id: clinicA.id, date, start: '09:00', end: '17:00' })
  await ins('therapist_availability', { therapist_id: thBong.id, clinic_id: clinicB.id, date, start: '11:00', end: '17:00' })
  await ins('therapist_availability', { therapist_id: thLina.id, clinic_id: clinicA.id, date, start: '13:00', end: '17:00' })
  windows += 3
}

console.log(JSON.stringify({
  clinics: [clinicA.id, clinicB.id],
  services: [svcPhysio.id, svcGround.id],
  therapists: { bong: thBong.id, lina: thLina.id },
  availabilityRows: windows,
}, null, 2))
console.log('✓ catalog seeded')
