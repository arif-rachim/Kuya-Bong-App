// Master admin deactivates / reactivates a user. app_users is owner-scoped, so
// flipping another user's `active` flag needs the service key. The Master Admin
// can never be deactivated. Writes an audit_log entry.
// input: { targetUserId, active, actorUserId?, actorName? }
module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
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
      actor_user_id: i.actorUserId || null, actor_name: i.actorName || 'Admin',
      action: i.active ? 'Reactivate user' : 'Deactivate user', detail: `${target.name} (${target.email})`,
      at: new Date().toISOString(),
    }),
  })
  return { ok: true }
}
