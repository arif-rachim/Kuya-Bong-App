// A patient accepts/declines an incoming friend request, or removes a friend.
// The friend row is owned by the requester, so the addressee can't update it via
// the SDK — this does it with the service key after verifying the caller is a
// party to the link. input: { friendId, action: 'accept'|'decline'|'remove', __callerToken }
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
  if (!i.friendId || !['accept', 'decline', 'remove'].includes(i.action)) return { error: 'Invalid request.' }

  const row = (await (await ctx.fetch(`${base}/data/friends/${i.friendId}`, { headers: { 'x-api-key': key } })).json()).data
  if (!row) return { error: 'Friend request not found.' }
  const isRequester = row.requester_user_id === callerId
  const isAddressee = row.addressee_user_id === callerId
  if (!isRequester && !isAddressee) return { error: 'Not authorized.' }

  if (i.action === 'accept') {
    if (!isAddressee || row.status !== 'pending') return { error: 'Only a pending request can be accepted by its recipient.' }
    const r = await ctx.fetch(`${base}/data/friends/${i.friendId}`, { method: 'PATCH', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ status: 'active' }) })
    if (!r.ok) return { error: 'Could not accept the request.' }
    return { ok: true, status: 'active' }
  }
  // decline (recipient) or remove (either party): delete the link
  if (i.action === 'decline' && !isAddressee) return { error: 'Only the recipient can decline a request.' }
  const r = await ctx.fetch(`${base}/data/friends/${i.friendId}`, { method: 'DELETE', headers: { 'x-api-key': key } })
  if (!r.ok) return { error: 'Could not update the friend request.' }
  return { ok: true, status: 'removed' }
}
