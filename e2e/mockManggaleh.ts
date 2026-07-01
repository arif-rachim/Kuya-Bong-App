import type { Page, Route } from '@playwright/test'

/**
 * A stateful in-memory fake of the manggaleh backend, installed via Playwright
 * route interception. The app runs in real manggaleh mode; every call to
 * api.manggaleh.com is served from here, so E2E tests exercise the production
 * code paths fully offline and never touch real data.
 *
 * OTP code in tests is always "123456". Seeded accounts:
 *   admin@test.com / admin123    (master admin)
 *   patient@test.com / patient123 (patient)
 */

type Row = Record<string, any>
export interface MockState {
  authUsers: { id: string; email: string; password: string; name: string; emailVerified: boolean }[]
  sessions: Record<string, string>
  db: Record<string, Row[]>
  seq: number
}

const PIXEL_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const PIXEL = `data:image/png;base64,${PIXEL_B64}`
const pad = (n: number) => String(n).padStart(2, '0')
const isoDay = (offset: number) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const PERM_KEYS = [
  'manage_booking', 'appointment_management', 'manage_clinics', 'manage_therapists', 'manage_patients',
  'manage_products', 'manage_services', 'manage_cancellation_reasons', 'manage_announcements',
  'manage_follow_up', 'reports_services', 'reports_products',
]

export function makeSeed(): MockState {
  const uAdmin = 'u-admin', uPat = 'u-pat'
  const availability: Row[] = []
  for (let d = 0; d < 14; d++) availability.push({ id: `av-${d}`, therapist_id: 't1', clinic_id: 'c1', date: isoDay(d), start: '09:00', end: '18:00' })
  return {
    seq: 0,
    sessions: {},
    authUsers: [
      { id: uAdmin, email: 'admin@test.com', password: 'admin123', name: 'Admin', emailVerified: true },
      { id: uPat, email: 'patient@test.com', password: 'patient123', name: 'Patient One', emailVerified: true },
    ],
    db: {
      app_users: [
        { id: 'au-admin', user_id: uAdmin, name: 'Admin', email: 'admin@test.com', role: 'admin', admin_level: 'master', active: true },
        { id: 'au-pat', user_id: uPat, name: 'Patient One', email: 'patient@test.com', role: 'patient', admin_level: null, active: true },
      ],
      patient_profiles: [{ id: 'pf-pat', user_id: uPat, family_group_id: uPat, active: true }],
      clinics: [{ id: 'c1', name: 'Downtown Clinic', address: 'Jl. Sudirman 1', active: true }],
      service_types: [{ id: 's1', name: 'Physiotherapy', duration_minutes: 60, active: true }],
      therapists: [{ id: 't1', name: 'Kuya Bong', active: true, user_id: null }],
      therapist_availability: availability,
      cancellation_reasons: [{ id: 'cr1', label: 'Patient is sick', active: true }, { id: 'cr2', label: 'Other', active: true }],
      package_definitions: [{ id: 'pd1', name: '6-Session Package', sessions: 6, validity_days: 90 }],
      products: [{ id: 'pr1', name: 'Herbal Balm', category: 'herbal', price: 100, active: true, image_object_ids: [] }],
      announcements: [],
      sub_admin_permissions: [Object.assign({ id: 'sap1', key: 'default' }, ...PERM_KEYS.map((k) => ({ [k]: true })))],
      appointments: [], patient_packages: [], package_usage: [], product_purchases: [],
      credit_transfers: [], audit_log: [], friends: [], family_members: [],
    },
  }
}

const pub = (u: MockState['authUsers'][0]) => ({ id: u.id, email: u.email, name: u.name, emailVerified: u.emailVerified })

// owner column per owner-scoped collection (for inserts + read filtering)
const OWNER: Record<string, string> = {
  appointments: 'patient_user_id', patient_packages: 'owner_user_id', product_purchases: 'patient_user_id',
  friends: 'requester_user_id', patient_profiles: 'user_id', family_members: 'owner_user_id', app_users: 'user_id',
}

function readColl(state: MockState, coll: string, caller: string | null): Row[] {
  const rows = state.db[coll] || []
  const ownerField = OWNER[coll]
  if (!ownerField) return rows // catalog: everyone reads all
  if (coll === 'friends') return rows.filter((r) => r.requester_user_id === caller) // owner-scoped read = own only
  return rows.filter((r) => r[ownerField] === caller)
}

function runFunction(name: string, input: Row, state: MockState, caller: string | null): Row {
  const db = state.db
  const id = () => `id-${++state.seq}`
  switch (name) {
    case 'admin_bootstrap':
      return { users: db.app_users, appointments: db.appointments, packages: db.patient_packages, usage: db.package_usage, purchases: db.product_purchases, transfers: db.credit_transfers, audit: db.audit_log }
    case 'friends_overview':
      return { friends: [], friendUsers: [] }
    case 'family_overview':
      return { family: db.family_members.filter((f) => f.family_group_id === caller || (f.linked_user_id === caller && f.status === 'pending')), inviters: [] }
    case 'book_appointment': {
      const i = input
      const row = { id: id(), patient_user_id: i.patientUserId, clinic_id: i.clinicId, service_type_id: i.serviceTypeId, therapist_id: i.therapistId, date: i.date, start: i.start, end: i.end, for_member_name: i.forMemberName || '', status: 'Confirmed', source: i.source || 'App' }
      db.appointments.push(row)
      return { id: row.id }
    }
    case 'catalog_write': {
      const { collection, op, data, id: rid } = input
      db[collection] ||= []
      if (op === 'insert') { const row = { id: id(), ...data }; db[collection].push(row); return { id: row.id } }
      if (op === 'update') { const r = db[collection].find((x) => x.id === rid); if (r) Object.assign(r, data); return { ok: true } }
      if (op === 'delete') { db[collection] = db[collection].filter((x) => x.id !== rid); return { ok: true } }
      return { error: 'bad op' }
    }
    case 'assign_package': {
      const i = input
      const row = { id: id(), owner_user_id: i.patientUserId, definition_id: i.definitionId, name: i.name, total_sessions: i.totalSessions, remaining: i.remaining, assign_date: isoDay(0), expiry_date: isoDay(i.validityDays || 90), status: 'active' }
      db.patient_packages.push(row)
      return { id: row.id, assignDate: row.assign_date, expiryDate: row.expiry_date, status: 'active' }
    }
    case 'set_appointment_status': {
      const a = db.appointments.find((x) => x.id === input.appointmentId)
      const map: Record<string, string> = { approve: 'Confirmed', reject: 'CancelledByAdmin', complete: 'Completed', noshow: 'NoShow', cancel: 'CancelledByAdmin' }
      if (a) a.status = map[input.action] || a.status
      return { ok: true, status: a?.status }
    }
    default:
      // generic write function: succeed
      return { ok: true }
  }
}

export async function installMockManggaleh(page: Page, state: MockState = makeSeed()): Promise<MockState> {
  const base = '/api/t/realief-expert/dev'
  await page.route(`**${base}/**`, async (route: Route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    const p = path.slice(path.indexOf(base) + base.length)
    const method = req.method()
    const bearer = (req.headers()['authorization'] || '').replace(/^Bearer\s+/i, '')
    const caller = state.sessions[bearer] || null
    const body = (): Row => { try { return JSON.parse(req.postData() || '{}') } catch { return {} } }
    const json = (status: number, obj: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(obj) })

    // ---------- AUTH ----------
    if (p === '/auth/sign-in/email') {
      const { email, password } = body()
      const u = state.authUsers.find((x) => x.email.toLowerCase() === String(email).toLowerCase() && x.password === password)
      if (!u) return json(401, { error: 'invalid' })
      const token = `tok-${++state.seq}`; state.sessions[token] = u.id
      return json(200, { token, user: pub(u) })
    }
    if (p === '/auth/sign-up/email') {
      const { email, password, name } = body()
      if (state.authUsers.some((x) => x.email.toLowerCase() === String(email).toLowerCase())) return json(422, { code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' })
      const u = { id: `u-${++state.seq}`, email, password, name, emailVerified: false }
      state.authUsers.push(u)
      const token = `tok-${++state.seq}`; state.sessions[token] = u.id
      return json(200, { token, user: pub(u) })
    }
    if (p === '/auth/get-session') { const u = state.authUsers.find((x) => x.id === caller); return json(200, u ? { user: pub(u) } : {}) }
    if (p === '/auth/sign-out') { delete state.sessions[bearer]; return json(200, {}) }
    if (p === '/auth/email-otp/send-verification-otp') return json(200, { success: true })
    if (p === '/auth/email-otp/verify-email') return body().otp === '123456' ? json(200, { status: true }) : json(400, { code: 'INVALID_OTP' })
    if (p === '/auth/change-password') return body().currentPassword ? json(200, { status: true }) : json(400, {})
    if (p === '/auth/request-password-reset') return json(200, { status: true })
    if (p === '/auth/reset-password') return body().token ? json(200, { status: true }) : json(400, {})

    // ---------- STORAGE ----------
    if (p === '/storage' && method === 'POST') return json(201, { object: { id: `obj-${++state.seq}` } })
    if (/^\/storage\/[^/]+\/sign$/.test(p)) return json(200, { url: PIXEL })
    if (/^\/storage\/[^/]+$/.test(p) && method === 'GET') return route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(PIXEL_B64, 'base64') })
    if (/^\/storage\/[^/]+$/.test(p) && method === 'DELETE') return json(200, {})

    // ---------- FUNCTIONS ----------
    if (p.startsWith('/functions/')) return json(200, { result: runFunction(p.slice('/functions/'.length), body(), state, caller) })

    // ---------- DATA ----------
    if (p.startsWith('/data/')) {
      const [coll, rowId] = p.slice('/data/'.length).split('/')
      const actAs = req.headers()['x-act-as-user'] || caller
      if (method === 'GET' && !rowId) return json(200, { data: readColl(state, coll, caller) })
      if (method === 'GET') return json(200, { data: (state.db[coll] || []).find((r) => r.id === rowId) || null })
      if (method === 'POST') {
        const owner = OWNER[coll] ? { [OWNER[coll]]: actAs } : {}
        const row = { id: `id-${++state.seq}`, ...owner, ...body() }
        ;(state.db[coll] ||= []).push(row)
        return json(200, { data: row })
      }
      if (method === 'PATCH') { const r = (state.db[coll] || []).find((x) => x.id === rowId); if (r) Object.assign(r, body()); return json(200, { data: r }) }
      if (method === 'DELETE') { state.db[coll] = (state.db[coll] || []).filter((x) => x.id !== rowId); return json(200, {}) }
    }

    return json(404, { error: `UNMOCKED ${method} ${p}` })
  })
  return state
}
