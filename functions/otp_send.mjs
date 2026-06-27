// Custom email OTP (manggaleh's built-in /auth/email-otp 500s, but ctx.email.send
// via Resend works). Generates a 6-digit code for the SIGNED-IN caller's own
// email, stores it in email_otps (single-use, 10-min expiry), and emails it.
// input: { __callerToken }
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
  const caller = await getCaller(ctx, (input || {}).__callerToken)
  if (!caller || !caller.email) return { error: 'Not authorized.' }
  const email = caller.email

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // one active code per email — clear any previous ones
  const existing = (await (await ctx.fetch(`${base}/data/email_otps?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  for (const r of existing.filter((x) => String(x.email || '').toLowerCase() === email))
    await ctx.fetch(`${base}/data/email_otps/${r.id}`, { method: 'DELETE', headers: { 'x-api-key': key } })

  const ins = await ctx.fetch(`${base}/data/email_otps`, { method: 'POST', headers: jh, body: JSON.stringify({ email, code, expires_at: expires, consumed: false, attempts: 0 }) })
  if (!ins.ok) return { error: 'Could not create the code.' }

  try {
    await ctx.email.send({
      to: email,
      subject: 'Your Kuya Bong verification code',
      text: `Your Kuya Bong verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    })
  } catch (e) {
    return { error: 'Could not send the verification email.' }
  }
  return { ok: true }
}
