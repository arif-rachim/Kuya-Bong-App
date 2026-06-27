// A patient accepts/declines an incoming adult-link request, or removes a family
// member (child or linked adult). Cross-owner writes go through the service key
// after verifying the caller is a party to the row.
// input: { familyMemberId, action: 'accept'|'decline'|'remove', __callerToken }
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
  if (!i.familyMemberId || !['accept', 'decline', 'remove'].includes(i.action)) return { error: 'Invalid request.' }

  const row = (await (await ctx.fetch(`${base}/data/family_members/${i.familyMemberId}`, { headers: { 'x-api-key': key } })).json()).data
  if (!row) return { error: 'Family member not found.' }
  const isOwner = row.family_group_id === callerId || row.parent_user_id === callerId
  const isLinked = row.linked_user_id === callerId

  if (i.action === 'accept') {
    if (!isLinked || row.status !== 'pending') return { error: 'Only the invited person can accept a pending request.' }
    const r = await ctx.fetch(`${base}/data/family_members/${i.familyMemberId}`, { method: 'PATCH', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ status: 'active' }) })
    if (!r.ok) return { error: 'Could not accept the request.' }
    return { ok: true, status: 'active' }
  }
  // decline (invited adult) or remove (owner, or the linked adult unlinking)
  if (i.action === 'decline' && !isLinked) return { error: 'Only the invited person can decline a request.' }
  if (i.action === 'remove' && !isOwner && !isLinked) return { error: 'Not authorized.' }
  const r = await ctx.fetch(`${base}/data/family_members/${i.familyMemberId}`, { method: 'DELETE', headers: { 'x-api-key': key } })
  if (!r.ok) return { error: 'Could not update the family member.' }
  return { ok: true, status: 'removed' }
}
