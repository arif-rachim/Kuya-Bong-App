// Book an appointment with server-side conflict checking (the client only sees
// its own rows, so cross-patient/therapist conflicts must be checked here).
// Reads all appointments via the SERVICE_KEY, validates no therapist/patient
// overlap, then inserts the row OWNED BY the patient via x-act-as-user.
// input: { patientUserId, clinicId, serviceTypeId, therapistId, date, start, end,
//          forMemberId?, forMemberName, source? }
const BUSY = ['PendingApproval', 'Confirmed', 'Rescheduled', 'Completed']
const toMin = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3, 5), 10)
const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1

module.exports = async (input, ctx) => {
  const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  if (!i.patientUserId || !i.therapistId || !i.date || !i.start || !i.end) return { error: 'Missing booking fields.' }

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
