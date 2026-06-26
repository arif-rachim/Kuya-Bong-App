// Admin-scope bootstrap: returns ALL cross-user data an admin needs (users,
// appointments, packages, usage, purchases, transfers, audit) via the
// SERVICE_KEY secret (bypasses per-user RLS). Catalog tables are read directly
// by the client (any logged-in user can read them).
module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const key = ctx.secrets.SERVICE_KEY
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
