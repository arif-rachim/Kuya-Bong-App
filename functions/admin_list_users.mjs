// Admin-scope read: list ALL app_users via the SERVICE_KEY secret (bypasses
// per-user RLS). Admin-only: re-resolves the caller from their token first.
// input: { __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  const id = s && s.user && s.user.id
  if (!id) return null
  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const me = rows.find((u) => u.user_id === id)
  return { id, role: me ? me.role : null }
}

module.exports = async (input, ctx) => {
  const caller = await getCaller(ctx, (input || {}).__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  const res = await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': ctx.secrets.SERVICE_KEY } })
  const rows = (await res.json()).data ?? []
  return { count: rows.length, sample: rows.slice(0, 3).map((u) => ({ name: u.name, role: u.role, adminLevel: u.admin_level })) }
}
