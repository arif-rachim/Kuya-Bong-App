// Admin assigns a package to a patient: inserts patient_packages OWNED BY the
// patient (x-act-as-user) with an editable initial remaining (v0.8), and writes
// an audit_log entry (service key).
// input: { patientUserId, definitionId, name, totalSessions, remaining,
//          validityDays, actorUserId, actorName, ownerName }
module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  if (!i.patientUserId || !i.name) return { error: 'Missing fields.' }
  const total = Number(i.totalSessions)
  let remaining = i.remaining == null ? total : Number(i.remaining)
  if (!(remaining >= 0)) return { error: 'Remaining sessions can\'t be negative.' }
  if (remaining > total) return { error: `Remaining can't exceed the package total (${total}).` }

  const d = new Date()
  const assign = d.toISOString().slice(0, 10)
  const exp = new Date(d.getTime() + (Number(i.validityDays) || 0) * 86400000).toISOString().slice(0, 10)
  const status = remaining <= 0 ? 'used' : 'active'

  const ins = await ctx.fetch(`${base}/data/patient_packages`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'x-act-as-user': i.patientUserId, 'content-type': 'application/json' },
    body: JSON.stringify({
      definition_id: i.definitionId || null, name: i.name, total_sessions: total, remaining,
      assign_date: assign, expiry_date: exp, status,
    }),
  })
  const j = await ins.json()
  if (!ins.ok) return { error: j.error || 'Could not assign the package.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: i.actorUserId || null, actor_name: i.actorName || 'Admin',
      action: 'Assign package', detail: `${i.name} -> ${i.ownerName || i.patientUserId} (remaining ${remaining}/${total})`,
      at: new Date().toISOString(),
    }),
  })
  return { id: j.data?.id, assignDate: assign, expiryDate: exp, status }
}
