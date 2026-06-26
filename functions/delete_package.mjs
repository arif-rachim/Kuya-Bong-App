// Admin pulls back / deletes a wrongly assigned package (+ its usage rows).
// input: { packageId, actorUserId, actorName, name }
module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  // delete usage rows referencing this package
  const usage = (await (await ctx.fetch(`${base}/data/package_usage?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  for (const u of usage.filter((x) => x.patient_package_id === i.packageId))
    await ctx.fetch(`${base}/data/package_usage/${u.id}`, { method: 'DELETE', headers: { 'x-api-key': key } })
  const res = await ctx.fetch(`${base}/data/patient_packages/${i.packageId}`, { method: 'DELETE', headers: { 'x-api-key': key } })
  if (!res.ok) return { error: 'Could not delete the package.' }
  await ctx.fetch(`${base}/data/audit_log`, { method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ actor_user_id: i.actorUserId || null, actor_name: i.actorName || 'Admin', action: 'Delete assigned package', detail: i.name || i.packageId, at: new Date().toISOString() }) })
  return { ok: true }
}
