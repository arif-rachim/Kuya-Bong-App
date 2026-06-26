// Admin advances a product purchase's follow-up status (owner-scoped collection,
// so a cross-user PATCH needs the service key). Admin-only. Audited.
// input: { purchaseId, status, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
const STATUSES = ['NotDue', 'Due', 'Contacted', 'Completed']
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  const id = s && s.user && s.user.id
  if (!id) return null
  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const me = rows.find((u) => u.user_id === id)
  return { id, name: me ? me.name : null, role: me ? me.role : null }
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  if (!i.purchaseId || !STATUSES.includes(i.status)) return { error: 'Invalid follow-up status.' }

  const res = await ctx.fetch(`${base}/data/product_purchases/${i.purchaseId}`, {
    method: 'PATCH', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ follow_up_status: i.status }),
  })
  if (!res.ok) return { error: 'Could not update the follow-up status.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Admin', action: 'Update follow-up status', detail: `${i.purchaseId} -> ${i.status}`, at: new Date().toISOString() }),
  })
  return { ok: true }
}
