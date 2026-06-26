// A patient transfers package sessions to a confirmed friend. Deducts from the
// caller's package and creates a new package OWNED BY the recipient (x-act-as-user)
// that keeps the original expiry, with a credit_transfers audit trail (v0.6 §5).
// input: { fromPackageId, toUserId, sessions, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
const today = () => new Date().toISOString().slice(0, 10)
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  const id = s && s.user && s.user.id
  if (!id) return null
  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const me = rows.find((u) => u.user_id === id)
  return { id, name: me ? me.name : null }
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const jh = { 'x-api-key': key, 'content-type': 'application/json' }
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller) return { error: 'Not authorized.' }
  const sessions = Number(i.sessions)
  if (!Number.isFinite(sessions) || sessions <= 0) return { error: 'Enter how many sessions to transfer.' }
  if (!i.toUserId || !i.fromPackageId) return { error: 'Missing transfer fields.' }

  const friends = (await (await ctx.fetch(`${base}/data/friends?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const confirmed = friends.some((f) => f.status === 'active' &&
    ((f.requester_user_id === caller.id && f.addressee_user_id === i.toUserId) ||
     (f.requester_user_id === i.toUserId && f.addressee_user_id === caller.id)))
  if (!confirmed) return { error: 'You can only transfer to a confirmed friend.' }

  const pkg = (await (await ctx.fetch(`${base}/data/patient_packages/${i.fromPackageId}`, { headers: { 'x-api-key': key } })).json()).data
  if (!pkg || pkg.owner_user_id !== caller.id) return { error: 'Package not found.' }
  if (pkg.expiry_date < today()) return { error: 'This package has expired and can\'t be transferred.' }
  if (sessions > Number(pkg.remaining)) return { error: 'You don\'t have that many sessions to transfer.' }

  const fromRemaining = Number(pkg.remaining) - sessions
  const up = await ctx.fetch(`${base}/data/patient_packages/${i.fromPackageId}`, { method: 'PATCH', headers: jh, body: JSON.stringify({ remaining: fromRemaining, status: fromRemaining <= 0 ? 'used' : 'active' }) })
  if (!up.ok) return { error: 'Could not deduct the sessions.' }

  const ins = await ctx.fetch(`${base}/data/patient_packages`, {
    method: 'POST', headers: { 'x-api-key': key, 'x-act-as-user': i.toUserId, 'content-type': 'application/json' },
    body: JSON.stringify({
      definition_id: pkg.definition_id || null, name: `${pkg.name} (from friend)`, total_sessions: sessions, remaining: sessions,
      assign_date: today(), expiry_date: pkg.expiry_date, status: 'active',
      source_package_id: pkg.id, transferred_from_user_id: caller.id,
    }),
  })
  const j = await ins.json()
  if (!ins.ok) {
    // best-effort rollback of the deduction
    await ctx.fetch(`${base}/data/patient_packages/${i.fromPackageId}`, { method: 'PATCH', headers: jh, body: JSON.stringify({ remaining: Number(pkg.remaining), status: pkg.status }) })
    return { error: j.error || 'Could not create the recipient package.' }
  }
  const recipientPackageId = j.data?.id

  await ctx.fetch(`${base}/data/credit_transfers`, {
    method: 'POST', headers: jh,
    body: JSON.stringify({ from_user_id: caller.id, to_user_id: i.toUserId, sessions, original_package_id: pkg.id, recipient_package_id: recipientPackageId, expiry_date: pkg.expiry_date, reversed: false }),
  })
  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST', headers: jh,
    body: JSON.stringify({ actor_user_id: caller.id, actor_name: caller.name || 'Patient', action: 'Transfer package credit', detail: `${sessions} session(s) from ${pkg.name}`, at: new Date().toISOString() }),
  })
  return { ok: true, recipientPackageId, fromRemaining }
}
