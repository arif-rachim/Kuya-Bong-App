// Admin-scope bootstrap: returns ALL cross-user data an admin needs (users,
// appointments, packages, usage, purchases, transfers, audit) via the
// SERVICE_KEY secret (bypasses per-user RLS). Catalog tables are read directly
// by the client (any logged-in user can read them).
// Admin-only: re-resolves the caller from their token and checks their role.
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
  const key = ctx.secrets.SERVICE_KEY
  const caller = await getCaller(ctx, (input || {}).__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  const get = async (coll) => {
    const res = await ctx.fetch(`${base}/data/${coll}?limit=200`, { headers: { 'x-api-key': key } })
    const j = await res.json()
    return j.data ?? []
  }
  const [users, appointments, packages, usage, purchases, transfers, audit] = await Promise.all([
    get('app_users'), get('appointments'), get('patient_packages'), get('package_usage'),
    get('product_purchases'), get('credit_transfers'), get('audit_log'),
  ])
  return { users, appointments, packages, usage, purchases, transfers, audit }
}
