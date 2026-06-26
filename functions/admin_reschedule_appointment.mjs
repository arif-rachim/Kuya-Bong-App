// Admin reschedules ANY patient's appointment (cross-user write via service key)
// with a server-side conflict re-check (therapist + patient overlap), ignoring
// the appointment being moved. Sets status to Rescheduled. Writes an audit_log.
// input: { appointmentId, therapistId, clinicId, date, start, end, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
const BUSY = ['PendingApproval', 'Confirmed', 'Rescheduled', 'Completed']
const toMin = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3, 5), 10)
const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1
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
  const jh = { 'x-api-key': key, 'content-type': 'application/json' }
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  if (!i.appointmentId || !i.therapistId || !i.date || !i.start || !i.end) return { error: 'Missing reschedule fields.' }

  const apt = (await (await ctx.fetch(`${base}/data/appointments/${i.appointmentId}`, { headers: { 'x-api-key': key } })).json()).data
  if (!apt) return { error: 'Appointment not found.' }
  const TERMINAL = ['Completed', 'NoShow', 'CancelledByPatient', 'CancelledByAdmin', 'CancelledByPhysiotherapist']
  if (TERMINAL.includes(apt.status)) return { error: `This appointment is already ${apt.status} and can't be moved.` }

  const all = ((await (await ctx.fetch(`${base}/data/appointments?limit=200`, { headers: { 'x-api-key': key } })).json()).data || [])
    .filter((a) => a.id !== i.appointmentId && a.date && String(a.date).slice(0, 10) === i.date && BUSY.includes(a.status))
  const s = toMin(i.start), e = toMin(i.end)
  for (const a of all) {
    if (!overlaps(s, e, toMin(a.start), toMin(a.end))) continue
    if (a.therapist_id === i.therapistId) return { error: 'The selected therapist is already booked for an overlapping time.' }
    if (a.patient_user_id === apt.patient_user_id) return { error: 'This patient already has an appointment that overlaps this time.' }
  }

  const res = await ctx.fetch(`${base}/data/appointments/${i.appointmentId}`, {
    method: 'PATCH', headers: jh,
    body: JSON.stringify({ status: 'Rescheduled', therapist_id: i.therapistId, clinic_id: i.clinicId, date: i.date, start: i.start, end: i.end }),
  })
  if (!res.ok) return { error: 'Could not reschedule the appointment.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST', headers: jh,
    body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Admin', action: 'Reschedule appointment', detail: `${apt.for_member_name || ''} · ${apt.date} ${apt.start} -> ${i.date} ${i.start}`, at: new Date().toISOString() }),
  })
  return { ok: true, status: 'Rescheduled' }
}
