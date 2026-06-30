// Read-side for the patient Family screen. Owner-scoped RLS only returns rows
// the caller owns, so an invited adult can't see an incoming link request (owned
// by the inviter) nor the inviter's name. Returns the caller's family group rows
// + incoming pending adult-link requests, with inviter names for resolution.
// input: { __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  return (s && s.user && s.user.id) || null
}
const toFamily = (r) => ({
  id: r.id, familyGroupId: r.family_group_id ?? '', name: r.name, relationship: r.relationship ?? 'dependent',
  isChild: !!r.is_child, linkedUserId: r.linked_user_id ?? undefined, parentUserId: r.parent_user_id ?? undefined, status: r.status,
})

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const callerId = await getCaller(ctx, (input || {}).__callerToken)
  if (!callerId) return { error: 'Not authorized.' }

  const all = (await (await ctx.fetch(`${base}/data/family_members?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  // a manggaleh-registered patient's family group id equals their own user id
  const group = callerId
  const mine = all.filter((r) => r.family_group_id === group || (r.linked_user_id === callerId && r.status === 'pending'))

  // inviter names for incoming requests (the row's owner / family group)
  const users = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const nameOf = (uid) => { const u = users.find((x) => x.user_id === uid); return u ? u.name : 'A patient' }
  const inviters = []
  const seen = new Set()
  for (const r of mine) {
    if (r.linked_user_id === callerId && r.family_group_id !== group && !seen.has(r.family_group_id)) {
      seen.add(r.family_group_id)
      inviters.push({ familyGroupId: r.family_group_id, name: nameOf(r.family_group_id) })
    }
  }
  return { family: mine.map(toFamily), inviters }
}
