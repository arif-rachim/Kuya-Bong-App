// Generic admin catalog writer for the shared/admin collections (clinics,
// services, therapists, products, cancellation reasons, announcements, package
// definitions, availability). Admin-only; columns are whitelisted per collection
// so a caller can't write arbitrary/owner columns. Writes an audit_log entry.
// input: { collection, op: 'insert'|'update'|'delete', id?, data?, label?, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'

// allowlisted writable columns per collection (everything else is dropped)
const COLUMNS = {
  clinics: ['name', 'address', 'contact', 'active'],
  service_types: ['name', 'duration_minutes', 'active', 'notes'],
  therapists: ['name', 'active', 'user_id'],
  products: ['name', 'category', 'price', 'active', 'notes', 'image_object_ids'],
  cancellation_reasons: ['label', 'active'],
  announcements: ['title', 'message', 'expiry_date', 'published'],
  package_definitions: ['name', 'sessions', 'validity_days'],
  therapist_availability: ['therapist_id', 'clinic_id', 'date', 'start', 'end'],
}

async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  const id = s && s.user && s.user.id
  if (!id) return null
  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const me = rows.find((u) => u.user_id === id)
  return { id, name: me ? me.name : null, role: me ? me.role : null, level: me ? me.admin_level : null }
}

const pick = (cols, data) => {
  const out = {}
  for (const c of cols) if (data && data[c] !== undefined) out[c] = data[c]
  return out
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const jh = { 'x-api-key': key, 'content-type': 'application/json' }
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }

  const cols = COLUMNS[i.collection]
  if (!cols) return { error: 'Unknown collection.' }
  const url = `${base}/data/${i.collection}`

  let result
  if (i.op === 'insert') {
    const body = pick(cols, i.data)
    const r = await ctx.fetch(url, { method: 'POST', headers: jh, body: JSON.stringify(body) })
    const j = await r.json()
    if (!r.ok) return { error: j.error || 'Could not create the record.' }
    result = { id: j.data?.id }
  } else if (i.op === 'update') {
    if (!i.id) return { error: 'Missing id.' }
    const body = pick(cols, i.data)
    const r = await ctx.fetch(`${url}/${i.id}`, { method: 'PATCH', headers: jh, body: JSON.stringify(body) })
    if (!r.ok) return { error: 'Could not update the record.' }
    result = { ok: true }
  } else if (i.op === 'delete') {
    if (!i.id) return { error: 'Missing id.' }
    const r = await ctx.fetch(`${url}/${i.id}`, { method: 'DELETE', headers: { 'x-api-key': key } })
    if (!r.ok) return { error: 'Could not delete the record.' }
    result = { ok: true }
  } else {
    return { error: 'Unknown op.' }
  }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST', headers: jh,
    body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Admin', action: i.label || `Catalog ${i.op} ${i.collection}`, detail: i.id || result.id || '', at: new Date().toISOString() }),
  })
  return result
}
