// Master admin deactivates / reactivates a user. app_users is owner-scoped, so
// flipping another user's `active` flag needs the service key. Only the Master
// Admin may do this, and the Master Admin can never be deactivated. Audited.
// input: { targetUserId, active, __callerToken }
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
  if (!caller || caller.role !== 'admin' || caller.level !== 'master') return { error: 'Not authorized.' }
  if (!i.targetUserId || typeof i.active !== 'boolean') return { error: 'Missing fields.' }

  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const target = rows.find((u) => u.user_id === i.targetUserId)
  if (!target) return { error: 'User not found.' }
  if (i.active === false && target.admin_level === 'master') return { error: 'The Master Admin can\'t be deactivated.' }

  const res = await ctx.fetch(`${base}/data/app_users/${target.id}`, {
    method: 'PATCH', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ active: i.active }),
  })
  if (!res.ok) return { error: 'Could not update the user.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: caller.id, actor_name: caller.name || 'Admin',
      action: i.active ? 'Reactivate user' : 'Deactivate user', detail: `${target.name} (${target.email})`,
      at: new Date().toISOString(),
    }),
  })
  return { ok: true }
}
