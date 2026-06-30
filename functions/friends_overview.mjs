// Read-side for the patient Friends screen: a patient can't read friend rows
// owned by the other party (RLS) nor other users' names (owner-scoped app_users),
// so this returns the caller's friend links in BOTH directions plus the display
// names of just those friends. Any logged-in user may call it (self-service).
// input: { __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  return (s && s.user && s.user.id) || null
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const callerId = await getCaller(ctx, (input || {}).__callerToken)
  if (!callerId) return { error: 'Not authorized.' }

  const friends = ((await (await ctx.fetch(`${base}/data/friends?limit=200`, { headers: { 'x-api-key': key } })).json()).data || [])
    .filter((f) => f.requester_user_id === callerId || f.addressee_user_id === callerId)
  const users = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const nameOf = (uid) => { const u = users.find((x) => x.user_id === uid); return u ? u.name : '' }
  // only expose the names of the caller's actual friends
  const friendUsers = []
  const seen = new Set()
  for (const f of friends) {
    const other = f.requester_user_id === callerId ? f.addressee_user_id : f.requester_user_id
    if (seen.has(other)) continue
    seen.add(other)
    friendUsers.push({ id: other, name: nameOf(other) })
  }
  return {
    friends: friends.map((f) => ({ id: f.id, requesterUserId: f.requester_user_id, addresseeUserId: f.addressee_user_id, status: f.status })),
    friendUsers,
  }
}
