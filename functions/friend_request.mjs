// A patient sends a friend request by the other user's email. Resolves the
// target (app_users is owner-scoped, so the caller can't look them up directly),
// dedupes against any existing link in either direction, and inserts the friend
// row OWNED BY the caller (x-act-as-user). input: { email, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  return (s && s.user && s.user.id) || null
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  const callerId = await getCaller(ctx, i.__callerToken)
  if (!callerId) return { error: 'Not authorized.' }
  const email = String(i.email || '').trim().toLowerCase()
  if (!email) return { error: 'Enter the friend\'s email.' }

  const users = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const target = users.find((u) => String(u.email || '').toLowerCase() === email)
  if (!target) return { error: 'That email isn\'t registered. Friends must be registered users.' }
  if (target.user_id === callerId) return { error: 'You can\'t add yourself as a friend.' }

  const friends = (await (await ctx.fetch(`${base}/data/friends?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const exists = friends.some((f) =>
    (f.requester_user_id === callerId && f.addressee_user_id === target.user_id) ||
    (f.requester_user_id === target.user_id && f.addressee_user_id === callerId))
  if (exists) return { error: 'You already have a friend link (or pending request) with this person.' }

  const ins = await ctx.fetch(`${base}/data/friends`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'x-act-as-user': callerId, 'content-type': 'application/json' },
    body: JSON.stringify({ addressee_user_id: target.user_id, status: 'pending' }),
  })
  const j = await ins.json()
  if (!ins.ok) return { error: j.error || 'Could not send the friend request.' }
  return { id: j.data?.id, addresseeUserId: target.user_id, addresseeName: target.name }
}
