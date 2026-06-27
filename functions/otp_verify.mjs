// Verifies a custom email OTP for the SIGNED-IN caller's own email. Single-use,
// 10-min expiry, max 5 attempts. input: { code, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  const u = s && s.user
  return u && u.id ? { id: u.id, email: String(u.email || '').toLowerCase() } : null
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const jh = { 'x-api-key': key, 'content-type': 'application/json' }
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || !caller.email) return { error: 'Not authorized.' }
  const code = String(i.code || '').trim()

  const rows = (await (await ctx.fetch(`${base}/data/email_otps?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const row = rows.find((r) => String(r.email || '').toLowerCase() === caller.email && !r.consumed)
  if (!row) return { error: 'No active code. Please request a new one.' }
  if (row.expires_at < new Date().toISOString()) {
    await ctx.fetch(`${base}/data/email_otps/${row.id}`, { method: 'PATCH', headers: jh, body: JSON.stringify({ consumed: true }) })
    return { error: 'That code has expired. Please request a new one.' }
  }
  if (String(row.code) !== code) {
    const attempts = Number(row.attempts || 0) + 1
    // invalidate after too many wrong guesses (brute-force guard)
    await ctx.fetch(`${base}/data/email_otps/${row.id}`, { method: 'PATCH', headers: jh, body: JSON.stringify(attempts >= 5 ? { consumed: true, attempts } : { attempts }) })
    return { error: attempts >= 5 ? 'Too many attempts. Please request a new code.' : 'That code is incorrect.' }
  }
  await ctx.fetch(`${base}/data/email_otps/${row.id}`, { method: 'PATCH', headers: jh, body: JSON.stringify({ consumed: true }) })
  return { ok: true }
}
