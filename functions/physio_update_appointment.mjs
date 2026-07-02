// A physiotherapist cancels or reschedules an appointment assigned to their own
// therapist record. The appointment is owned by the patient, so the write is done
// via the service key AFTER verifying the caller is the assigned therapist.
// input: { appointmentId, action:'cancel'|'reschedule', reasonId?, note?,
//          date?, start?, end?, __callerToken }
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
  const users = (await (await ctx.fetch(`${base}/data/app_users?limit=500`, { headers: { 'x-api-key': key } })).json()).data || []
  const me = users.find((u) => u.user_id === id)
  return { id, name: me ? me.name : null }
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const h = { 'x-api-key': key }
  const jh = { 'x-api-key': key, 'content-type': 'application/json' }
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller) return { error: 'Not authorized.' }
  if (!i.appointmentId || !['cancel', 'reschedule'].includes(i.action)) return { error: 'Invalid request.' }

  const therapists = (await (await ctx.fetch(`${base}/data/therapists?limit=200`, { headers: h })).json()).data || []
  const mine = therapists.filter((t) => t.user_id === caller.id && t.active !== false).map((t) => t.id)

  const apt = (await (await ctx.fetch(`${base}/data/appointments/${i.appointmentId}`, { headers: h })).json()).data
  if (!apt) return { error: 'Appointment not found.' }
  if (!mine.includes(apt.therapist_id)) return { error: 'This appointment is not assigned to you.' }
  const TERMINAL = ['Completed', 'NoShow', 'CancelledByPatient', 'CancelledByAdmin', 'CancelledByPhysiotherapist']
  if (TERMINAL.includes(apt.status)) return { error: `This appointment is already ${apt.status} and can't be changed.` }

  if (i.action === 'cancel') {
    const patch = { status: 'CancelledByPhysiotherapist', cancelled_by: 'physiotherapist' }
    if (i.reasonId) patch.cancellation_reason_id = i.reasonId
    if (i.note) patch.cancellation_note = i.note
    const r = await ctx.fetch(`${base}/data/appointments/${i.appointmentId}`, { method: 'PATCH', headers: jh, body: JSON.stringify(patch) })
    if (!r.ok) return { error: 'Could not cancel the appointment.' }
    await ctx.fetch(`${base}/data/audit_log`, { method: 'POST', headers: jh, body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Physiotherapist', action: 'Physio cancel appointment', detail: `${apt.for_member_name || ''} · ${apt.date} ${apt.start}`, at: new Date().toISOString() }) })
    return { ok: true, status: 'CancelledByPhysiotherapist' }
  }

  // reschedule: keep the same therapist, validate + conflict-check the new window
  if (!i.date || !i.start || !i.end) return { error: 'Missing reschedule fields.' }
  const clinicId = i.clinicId || apt.clinic_id
  const s = toMin(i.start), e = toMin(i.end)
  if (e <= s) return { error: 'End time must be after the start time.' }
  const all = ((await (await ctx.fetch(`${base}/data/appointments?limit=500`, { headers: h })).json()).data || [])
    .filter((a) => a.id !== apt.id && a.date && String(a.date).slice(0, 10) === i.date && BUSY.includes(a.status))
  for (const a of all) {
    if (!overlaps(s, e, toMin(a.start), toMin(a.end))) continue
    if (a.therapist_id === apt.therapist_id) return { error: 'The therapist is already booked for an overlapping time.' }
    if (a.patient_user_id === apt.patient_user_id) return { error: 'The patient already has an overlapping appointment.' }
  }
  const r = await ctx.fetch(`${base}/data/appointments/${i.appointmentId}`, { method: 'PATCH', headers: jh, body: JSON.stringify({ status: 'Rescheduled', clinic_id: clinicId, date: i.date, start: i.start, end: i.end }) })
  if (!r.ok) return { error: 'Could not reschedule the appointment.' }
  await ctx.fetch(`${base}/data/audit_log`, { method: 'POST', headers: jh, body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Physiotherapist', action: 'Physio reschedule appointment', detail: `${apt.for_member_name || ''} → ${i.date} ${i.start}`, at: new Date().toISOString() }) })
  return { ok: true, status: 'Rescheduled' }
}
