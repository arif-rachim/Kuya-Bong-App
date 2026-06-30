// Master admin appoints / removes a sub-admin by flipping a user's app_users
// role + admin_level. Master-only; the Master Admin's own role is immutable.
// input: { targetUserId, role: 'admin'|'patient', adminLevel: 'sub'|null, __callerToken }
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
  if (!i.targetUserId || (i.role !== 'admin' && i.role !== 'patient')) return { error: 'Invalid role.' }

  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const target = rows.find((u) => u.user_id === i.targetUserId)
  if (!target) return { error: 'User not found.' }
  if (target.admin_level === 'master') return { error: 'The Master Admin\'s role can\'t be changed.' }
  if (i.role === 'admin' && target.role === 'admin') return { error: 'This user is already an admin.' }

  const res = await ctx.fetch(`${base}/data/app_users/${target.id}`, {
    method: 'PATCH', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ role: i.role, admin_level: i.adminLevel ?? null }),
  })
  if (!res.ok) return { error: 'Could not update the user role.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: caller.id, actor_name: caller.name || 'Admin',
      action: i.role === 'admin' ? 'Appoint sub-admin' : 'Remove sub-admin', detail: `${target.name} (${target.email})`,
      at: new Date().toISOString(),
    }),
  })
  return { ok: true }
}
