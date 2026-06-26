// Admin assigns a package to a patient: inserts patient_packages OWNED BY the
// patient (x-act-as-user) with an editable initial remaining (v0.8), and writes
// an audit_log entry (service key).
// input: { patientUserId, definitionId, name, totalSessions, remaining,
//          validityDays, ownerName, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
// Resolve the caller from their session token (the runtime strips Authorization),
// then look up their app_users role. Returns null for anonymous callers.
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

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  if (!i.patientUserId || !i.name) return { error: 'Missing fields.' }
  const total = Number(i.totalSessions)
  let remaining = i.remaining == null ? total : Number(i.remaining)
  if (!(remaining >= 0)) return { error: 'Remaining sessions can\'t be negative.' }
  if (remaining > total) return { error: `Remaining can't exceed the package total (${total}).` }

  const d = new Date()
  const assign = d.toISOString().slice(0, 10)
  const exp = new Date(d.getTime() + (Number(i.validityDays) || 0) * 86400000).toISOString().slice(0, 10)
  const status = remaining <= 0 ? 'used' : 'active'

  const ins = await ctx.fetch(`${base}/data/patient_packages`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'x-act-as-user': i.patientUserId, 'content-type': 'application/json' },
    body: JSON.stringify({
      definition_id: i.definitionId || null, name: i.name, total_sessions: total, remaining,
      assign_date: assign, expiry_date: exp, status,
    }),
  })
  const j = await ins.json()
  if (!ins.ok) return { error: j.error || 'Could not assign the package.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: caller.id, actor_name: caller.name || 'Admin',
      action: 'Assign package', detail: `${i.name} -> ${i.ownerName || i.patientUserId} (remaining ${remaining}/${total})`,
      at: new Date().toISOString(),
    }),
  })
  return { id: j.data?.id, assignDate: assign, expiryDate: exp, status }
}
