// Returns the appointments assigned to the caller's physiotherapist record(s),
// plus the patients' display names. A physiotherapist is a patient-role user, so
// owner-scoped RLS never returns appointments owned by OTHER patients even when
// they're assigned to this therapist — this Function bridges that (service key).
// input: { __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCallerId(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  return (s && s.user && s.user.id) || null
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const h = { 'x-api-key': key }
  const callerId = await getCallerId(ctx, (input || {}).__callerToken)
  if (!callerId) return { error: 'Not authorized.' }

  const therapists = (await (await ctx.fetch(`${base}/data/therapists?limit=200`, { headers: h })).json()).data || []
  const mine = therapists.filter((t) => t.user_id === callerId && t.active !== false).map((t) => t.id)
  if (!mine.length) return { appointments: [], patients: [] }

  const all = (await (await ctx.fetch(`${base}/data/appointments?limit=500`, { headers: h })).json()).data || []
  const appointments = all.filter((a) => mine.includes(a.therapist_id))

  const ids = [...new Set(appointments.map((a) => a.patient_user_id).filter(Boolean))]
  const users = (await (await ctx.fetch(`${base}/data/app_users?limit=500`, { headers: h })).json()).data || []
  const patients = users.filter((u) => ids.includes(u.user_id)).map((u) => ({ id: u.user_id, name: u.name }))

  return { appointments, patients }
}
