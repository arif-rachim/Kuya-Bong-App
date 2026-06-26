// Admin-scope read: list ALL app_users via the SERVICE_KEY secret (bypasses
// per-user RLS). Uses ctx.fetch against the data REST API (egress-allowlisted).
// Foundation for every admin "see all data" screen.
module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const res = await ctx.fetch(`${base}/data/app_users?limit=200`, {
    headers: { 'x-api-key': ctx.secrets.SERVICE_KEY },
  })
  const json = await res.json()
  const rows = json.data ?? []
  return { count: rows.length, sample: rows.slice(0, 3).map((u) => ({ name: u.name, role: u.role, adminLevel: u.admin_level })) }
}
