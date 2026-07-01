/**
 * Server-side test fixtures: set up deterministic preconditions for negative /
 * stateful flows that are awkward to arrange through the UI (e.g. "patient has an
 * expired package", "an appointment already exists to reschedule").
 *
 * These run in Node (the Playwright worker), talking to the manggaleh REST API
 * directly with a SERVICE key + `x-act-as-user` (the proven admin-write pattern).
 * The key is read from MANGGALEH_SERVICE_KEY at runtime and is NEVER committed —
 * fixtures no-op / tests skip when it is absent.
 */
import { createClient } from '@manggaleh/sdk'

const BASE = process.env.MANGGALEH_BASE_URL ?? 'https://api.manggaleh.com'
const TENANT = process.env.VITE_MANGGALEH_TENANT ?? process.env.MANGGALEH_TENANT ?? 'realief-expert'
const ENV = process.env.VITE_MANGGALEH_ENV ?? process.env.MANGGALEH_ENV ?? 'dev'
const SERVICE_KEY = process.env.MANGGALEH_SERVICE_KEY ?? ''

/** True when a service key is available → fixtures (and the tests needing them) can run. */
export const hasServiceKey = !!SERVICE_KEY

/** A service-key client, optionally acting as a specific user (owner-scoped writes). */
export function svc(actAsUser?: string) {
  return createClient({ baseUrl: BASE, tenant: TENANT, env: ENV, apiKey: SERVICE_KEY, actAsUser })
}

/** Resolve a user's id by email (service-key admin lookup). */
export async function userIdByEmail(email: string): Promise<string> {
  const c: any = svc()
  const u = await c.admin.users.findByEmail(email)
  const id = u?.id ?? u?.user?.id
  if (!id) throw new Error(`no user for ${email}`)
  return id
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }

/** Look up the first active clinic / service / therapist ids (catalog is shared-readable). */
export async function catalogIds() {
  const c = svc()
  const [clinics, services, therapists] = await Promise.all([
    c.data.from('clinics').list({ limit: 50 }),
    c.data.from('service_types').list({ limit: 50 }),
    c.data.from('therapists').list({ limit: 50 }),
  ])
  const active = (a: any[]) => a.filter((r) => r.active !== false)
  return {
    clinicId: active(clinics)[0]?.id as string,
    serviceId: active(services)[0]?.id as string,
    therapistId: active(therapists)[0]?.id as string,
  }
}

/**
 * Create an appointment owned by `email`'s user, `daysAhead` from today (default
 * 5 → safely outside the 24h cancel cutoff). Returns the new appointment id.
 */
export async function makeAppointment(email: string, opts: { daysAhead?: number; start?: string; end?: string; status?: string } = {}): Promise<string> {
  const uid = await userIdByEmail(email)
  const cat = await catalogIds()
  const row = await svc(uid).data.from('appointments').insert({
    clinic_id: cat.clinicId, service_type_id: cat.serviceId, therapist_id: cat.therapistId,
    date: addDays(opts.daysAhead ?? 5), start: opts.start ?? '10:00', end: opts.end ?? '13:00',
    for_member_name: 'E2E', status: opts.status ?? 'Confirmed', source: 'App',
  })
  return (row as any).id
}

/** Give `email`'s user a package. `remaining`/`daysValid` let negatives (0 left / expired) be set up. */
export async function makePackage(email: string, opts: { total?: number; remaining?: number; daysValid?: number; name?: string } = {}): Promise<string> {
  const uid = await userIdByEmail(email)
  const total = opts.total ?? 6
  const row = await svc(uid).data.from('patient_packages').insert({
    name: opts.name ?? 'E2E Package', total_sessions: total, remaining: opts.remaining ?? total,
    assign_date: addDays(-1), expiry_date: addDays(opts.daysValid ?? 90),
    status: (opts.remaining ?? total) <= 0 ? 'used' : (opts.daysValid ?? 90) < 0 ? 'expired' : 'active',
  })
  return (row as any).id
}

/** Best-effort cleanup of a row created by a fixture. */
export async function deleteRow(collection: string, id: string, actAsUser?: string): Promise<void> {
  try { await svc(actAsUser).data.from(collection).remove(id) } catch { /* ignore */ }
}
