// Book an appointment with server-side conflict checking (the client only sees
// its own rows, so cross-patient/therapist conflicts must be checked here).
// Reads all appointments via the SERVICE_KEY, validates no therapist/patient
// overlap, then inserts the row OWNED BY the patient via x-act-as-user.
// The caller may only book for themselves (caller == patientUserId) unless they
// are an admin (e.g. phone bookings). input: { patientUserId, clinicId,
// serviceTypeId, therapistId, date, start, end, forMemberId?, forMemberName,
// source?, __callerToken }
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
  return { id, role: me ? me.role : null }
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller) return { error: 'Not authorized.' }
  if (!i.patientUserId || !i.therapistId || !i.date || !i.start || !i.end) return { error: 'Missing booking fields.' }
  // a patient may only book for themselves; admins may book on anyone's behalf
  if (caller.id !== i.patientUserId && caller.role !== 'admin') return { error: 'Not authorized.' }

  const res = await ctx.fetch(`${base}/data/appointments?limit=200`, { headers: { 'x-api-key': key } })
  const all = ((await res.json()).data || []).filter((a) => a.date && String(a.date).slice(0, 10) === i.date && BUSY.includes(a.status))
  const s = toMin(i.start), e = toMin(i.end)
  for (const a of all) {
    if (!overlaps(s, e, toMin(a.start), toMin(a.end))) continue
    if (a.therapist_id === i.therapistId) return { error: 'The selected therapist is already booked for an overlapping time.' }
    if (a.patient_user_id === i.patientUserId) return { error: 'You already have an appointment that overlaps this time.' }
  }

  const ins = await ctx.fetch(`${base}/data/appointments`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'x-act-as-user': i.patientUserId, 'content-type': 'application/json' },
    body: JSON.stringify({
      clinic_id: i.clinicId, service_type_id: i.serviceTypeId, therapist_id: i.therapistId,
      date: i.date, start: i.start, end: i.end,
      for_member_id: i.forMemberId || null, for_member_name: i.forMemberName || '',
      status: 'Confirmed', source: i.source || 'App',
    }),
  })
  const j = await ins.json()
  if (!ins.ok) return { error: j.error || 'Could not create the appointment.' }
  return { id: j.data?.id }
}
