// Admin appointment lifecycle on ANY patient's appointment (cross-user write via
// service key): approve / reject / complete / noshow / cancel. "complete" can
// deduct one session from a chosen package (BR-13/14) and records a usage row.
// Writes an audit_log entry.
// input: { appointmentId, action, patientPackageId?, reasonId?, note?, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
const today = () => new Date().toISOString().slice(0, 10)
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
  const h = { 'x-api-key': key }
  const jh = { 'x-api-key': key, 'content-type': 'application/json' }
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  const ACTIONS = { approve: 'Confirmed', reject: 'CancelledByAdmin', complete: 'Completed', noshow: 'NoShow', cancel: 'CancelledByAdmin' }
  const status = ACTIONS[i.action]
  if (!i.appointmentId || !status) return { error: 'Invalid action.' }

  const apt = (await (await ctx.fetch(`${base}/data/appointments/${i.appointmentId}`, { headers: h })).json()).data
  if (!apt) return { error: 'Appointment not found.' }
  // already in a terminal state — refuse (prevents e.g. double session deduction)
  const TERMINAL = ['Completed', 'NoShow', 'CancelledByPatient', 'CancelledByAdmin', 'CancelledByPhysiotherapist']
  if (TERMINAL.includes(apt.status)) return { error: `This appointment is already ${apt.status} and can't be changed.` }

  // complete: optionally deduct one session from a package + record usage
  let remaining
  if (i.action === 'complete' && i.patientPackageId) {
    const pkg = (await (await ctx.fetch(`${base}/data/patient_packages/${i.patientPackageId}`, { headers: h })).json()).data
    if (!pkg) return { error: 'Package not found.' }
    if (pkg.expiry_date < today()) return { error: 'Package has expired — it can\'t be used.' }
    if (Number(pkg.remaining) <= 0) return { error: 'No sessions left in this package.' }
    remaining = Number(pkg.remaining) - 1
    const pkgStatus = remaining <= 0 ? 'used' : 'active'
    const up = await ctx.fetch(`${base}/data/patient_packages/${i.patientPackageId}`, { method: 'PATCH', headers: jh, body: JSON.stringify({ remaining, status: pkgStatus }) })
    if (!up.ok) return { error: 'Could not deduct the session.' }
    await ctx.fetch(`${base}/data/package_usage`, { method: 'POST', headers: jh, body: JSON.stringify({ patient_package_id: i.patientPackageId, appointment_id: apt.id, member_name: apt.for_member_name || '', date: today(), recorded_by: caller.name || 'Admin' }) })
  }

  const patch = { status }
  if (i.action === 'reject' || i.action === 'cancel') {
    patch.cancelled_by = 'admin'
    if (i.reasonId) patch.cancellation_reason_id = i.reasonId
    if (i.note) patch.cancellation_note = i.note
  }
  const res = await ctx.fetch(`${base}/data/appointments/${i.appointmentId}`, { method: 'PATCH', headers: jh, body: JSON.stringify(patch) })
  if (!res.ok) return { error: 'Could not update the appointment.' }

  const labels = { approve: 'Approve appointment', reject: 'Reject appointment', complete: 'Complete session', noshow: 'Mark no-show', cancel: 'Cancel appointment' }
  await ctx.fetch(`${base}/data/audit_log`, { method: 'POST', headers: jh, body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Admin', action: labels[i.action], detail: `${apt.for_member_name || ''} · ${apt.date} ${apt.start}`, at: new Date().toISOString() }) })
  return { ok: true, status, remaining }
}
