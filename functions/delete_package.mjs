// Admin pulls back / deletes a wrongly assigned package (+ its usage rows).
// input: { packageId, name, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
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
  // delete usage rows referencing this package
  const usage = (await (await ctx.fetch(`${base}/data/package_usage?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  for (const u of usage.filter((x) => x.patient_package_id === i.packageId))
    await ctx.fetch(`${base}/data/package_usage/${u.id}`, { method: 'DELETE', headers: { 'x-api-key': key } })
  const res = await ctx.fetch(`${base}/data/patient_packages/${i.packageId}`, { method: 'DELETE', headers: { 'x-api-key': key } })
  if (!res.ok) return { error: 'Could not delete the package.' }
  await ctx.fetch(`${base}/data/audit_log`, { method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Admin', action: 'Delete assigned package', detail: i.name || i.packageId, at: new Date().toISOString() }) })
  return { ok: true }
}
