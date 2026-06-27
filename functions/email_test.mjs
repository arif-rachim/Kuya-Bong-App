// DIAGNOSTIC (temporary): surfaces the real error behind the OTP send 500 by
// calling ctx.email.send directly and returning whatever it throws. Admin-only.
// Delete after debugging:  mg functions delete --name email_test --yes
// input: { to?, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  const id = s && s.user && s.user.id
  if (!id) return null
  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const me = rows.find((u) => u.user_id === id)
  return { id, role: me ? me.role : null }
}

module.exports = async (input, ctx) => {
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  const to = i.to || 'delivered@resend.dev'
  try {
    const r = await ctx.email.send({ to, subject: 'Kuya Bong email test', text: 'This is a manggaleh email delivery test.' })
    return { ok: true, result: r ?? null }
  } catch (e) {
    // return the real failure so we can see why OTP send 500s
    return { ok: false, name: e && e.name, message: e && (e.message || String(e)), detail: e && e.stack ? String(e.stack).slice(0, 600) : null }
  }
}
