// Admin corrects an assigned package's remaining sessions (service key bypasses RLS).
// input: { packageId, remaining, actorUserId, actorName, name }
module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  const cur = await (await ctx.fetch(`${base}/data/patient_packages/${i.packageId}`, { headers: { 'x-api-key': key } })).json()
  if (!cur.data) return { error: 'Package not found.' }
  const total = Number(cur.data.total_sessions)
  const remaining = Number(i.remaining)
  if (!(remaining >= 0)) return { error: 'Remaining can\'t be negative.' }
  if (remaining > total) return { error: `Remaining can't exceed the total (${total}).` }
  const expired = cur.data.expiry_date && cur.data.expiry_date < new Date().toISOString().slice(0, 10)
  const status = remaining <= 0 ? 'used' : expired ? 'expired' : 'active'
  const res = await ctx.fetch(`${base}/data/patient_packages/${i.packageId}`, { method: 'PATCH', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ remaining, status }) })
  if (!res.ok) return { error: 'Could not update the package.' }
  await ctx.fetch(`${base}/data/audit_log`, { method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ actor_user_id: i.actorUserId || null, actor_name: i.actorName || 'Admin', action: 'Edit package remaining', detail: `${i.name}: ${cur.data.remaining} -> ${remaining}`, at: new Date().toISOString() }) })
  return { ok: true, status }
}
