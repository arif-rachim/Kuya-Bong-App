/**
 * Seed demo auth users + their app_users (role) row, owner-scoped (inserted
 * while signed in as each user so RLS owner is set correctly). Then links the
 * physiotherapist user to the Dr. Lina therapist row (admin, service key).
 *   MANGGALEH_SERVICE_KEY=mgsk_xxx node scripts/manggaleh/seed_users.mjs
 */
import { createClient } from '@manggaleh/sdk'

const base = { baseUrl: 'https://api.manggaleh.com', tenant: 'realief-expert', env: 'dev' }
const PUB = 'mgpk_oHud3CHDUW9FwOkzhCtoH7JlFwJSNWNb'
const svcKey = process.env.MANGGALEH_SERVICE_KEY
if (!svcKey) { console.error('Set MANGGALEH_SERVICE_KEY'); process.exit(1) }

const users = [
  { email: 'admin@reliefexpert.app', password: 'admin123', name: 'Kuya Bong', role: 'admin', adminLevel: 'master' },
  { email: 'staff@reliefexpert.app', password: 'staff123', name: 'Erick (Sub-Admin)', role: 'admin', adminLevel: 'sub' },
  { email: 'physio@reliefexpert.app', password: 'physio123', name: 'Dr. Lina', role: 'patient', physio: true },
  { email: 'maria@example.com', password: 'patient123', name: 'Maria Santos', role: 'patient', family: [{ name: 'Jose Santos', relationship: 'child', is_child: true, status: 'active' }] },
  { email: 'ahmed@example.com', password: 'patient123', name: 'Ahmed Rahman', role: 'patient' },
]

const ids = {}
for (const u of users) {
  const c = createClient({ ...base, apiKey: PUB })
  let uid
  try {
    uid = (await c.auth.signUp({ email: u.email, password: u.password, name: u.name })).user.id
    console.log('signUp', u.email, '->', uid)
  } catch {
    uid = (await c.auth.signIn({ email: u.email, password: u.password })).user.id
    console.log('signIn (exists)', u.email, '->', uid)
  }
  ids[u.email] = uid
  // app_users role row (idempotent)
  const mine = await c.data.from('app_users').list({ limit: 1 })
  if (!mine.length) {
    await c.data.from('app_users').insert({ name: u.name, email: u.email, role: u.role, admin_level: u.adminLevel ?? null, active: true })
  }
  // family (owner-scoped) for this user
  if (u.family) {
    const fam = await c.data.from('family_members').list({ limit: 1 })
    if (!fam.length) {
      for (const m of u.family)
        await c.data.from('family_members').insert({ ...m, family_group_id: uid, parent_user_id: uid })
    }
  }
}

// link Dr. Lina therapist -> physio user (admin / service key)
const admin = createClient({ ...base, apiKey: svcKey })
const ths = await admin.data.from('therapists').list({ limit: 50 })
const lina = ths.find((t) => t.name === 'Dr. Lina')
if (lina && ids['physio@reliefexpert.app']) {
  await admin.data.from('therapists').update(lina.id, { user_id: ids['physio@reliefexpert.app'] })
  console.log('linked Dr. Lina therapist', lina.id, '-> user', ids['physio@reliefexpert.app'])
}
console.log('✓ users seeded')
