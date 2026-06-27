// A patient links a registered adult (by email) as family. Resolves the target
// (app_users is owner-scoped), dedupes any existing link in the caller's group,
// and inserts the family row OWNED BY the caller (x-act-as-user), pending the
// adult's approval (BR-17). input: { email, __callerToken }
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
  if (!email) return { error: 'Enter the person\'s email.' }

  const users = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const target = users.find((u) => String(u.email || '').toLowerCase() === email)
  if (!target) return { error: 'That email isn\'t registered. Please check again.' }
  if (target.user_id === callerId) return { error: 'You can\'t link your own account.' }

  const fam = (await (await ctx.fetch(`${base}/data/family_members?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  if (fam.some((m) => m.family_group_id === callerId && m.linked_user_id === target.user_id))
    return { error: 'This person is already linked (or has a pending request) in your family.' }

  const ins = await ctx.fetch(`${base}/data/family_members`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'x-act-as-user': callerId, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: target.name, relationship: 'spouse', is_child: false, linked_user_id: target.user_id,
      parent_user_id: callerId, status: 'pending', family_group_id: callerId,
    }),
  })
  const j = await ins.json()
  if (!ins.ok) return { error: j.error || 'Could not send the link request.' }
  return { id: j.data?.id, linkedUserId: target.user_id, name: target.name }
}
