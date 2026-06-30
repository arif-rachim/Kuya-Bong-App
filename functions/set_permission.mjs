// Master admin toggles a single sub-admin permission column on the shared
// sub_admin_permissions row. Master-only; the column is whitelisted. Audited.
// input: { column, value, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
const COLS = [
  'manage_booking', 'appointment_management', 'manage_clinics', 'manage_therapists', 'manage_patients',
  'manage_products', 'manage_services', 'manage_cancellation_reasons', 'manage_announcements',
  'manage_follow_up', 'reports_services', 'reports_products',
]
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
  if (!COLS.includes(i.column) || typeof i.value !== 'boolean') return { error: 'Invalid permission.' }

  const rows = (await (await ctx.fetch(`${base}/data/sub_admin_permissions?limit=1`, { headers: { 'x-api-key': key } })).json()).data || []
  if (!rows[0]) return { error: 'Permissions row not found.' }

  const res = await ctx.fetch(`${base}/data/sub_admin_permissions/${rows[0].id}`, {
    method: 'PATCH', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ [i.column]: i.value }),
  })
  if (!res.ok) return { error: 'Could not update the permission.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Admin', action: 'Change sub-admin permission', detail: `${i.column} = ${i.value ? 'on' : 'off'}`, at: new Date().toISOString() }),
  })
  return { ok: true }
}
