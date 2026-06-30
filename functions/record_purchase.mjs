// Admin records a product purchase for a patient: snapshots the current product
// price (BR-19), inserts product_purchases OWNED BY the patient (x-act-as-user),
// and writes an audit_log entry (service key).
// input: { patientUserId, productId, quantity, followUpDays?, notes?,
//          ownerName?, __callerToken }
const base = 'https://api.manggaleh.com/api/t/realief-expert/dev'
async function getCaller(ctx, token) {
  if (!token) return null
  const key = ctx.secrets.SERVICE_KEY
  const s = await (await ctx.fetch(`${base}/auth/get-session`, { headers: { 'x-api-key': key, authorization: `Bearer ${token}` } })).json()
  const id = s && s.user && s.user.id
  if (!id) return null
  const rows = (await (await ctx.fetch(`${base}/data/app_users?limit=200`, { headers: { 'x-api-key': key } })).json()).data || []
  const me = rows.find((u) => u.user_id === id)
  return { id, name: me ? me.name : null, role: me ? me.role : null, level: me ? me.admin_level : null }
}

module.exports = async (input, ctx) => {
  const key = ctx.secrets.SERVICE_KEY
  const i = input || {}
  const caller = await getCaller(ctx, i.__callerToken)
  if (!caller || caller.role !== 'admin') return { error: 'Not authorized.' }
  if (!i.patientUserId || !i.productId) return { error: 'Missing fields.' }
  const qty = Number(i.quantity) || 1
  if (qty <= 0) return { error: 'Quantity must be greater than 0.' }

  const prod = (await (await ctx.fetch(`${base}/data/products/${i.productId}`, { headers: { 'x-api-key': key } })).json()).data
  if (!prod) return { error: 'Product not found.' }
  if (prod.active === false) return { error: 'Inactive products can\'t be sold.' }

  const today = new Date().toISOString().slice(0, 10)
  const followUp = i.followUpDays ? new Date(Date.now() + Number(i.followUpDays) * 86400000).toISOString().slice(0, 10) : null

  const ins = await ctx.fetch(`${base}/data/product_purchases`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'x-act-as-user': i.patientUserId, 'content-type': 'application/json' },
    body: JSON.stringify({
      product_id: i.productId, product_name: prod.name, unit_price_at_sale: prod.price, quantity: qty,
      purchase_date: today, estimated_follow_up_date: followUp, follow_up_status: 'NotDue', notes: i.notes || null,
    }),
  })
  const j = await ins.json()
  if (!ins.ok) return { error: j.error || 'Could not record the purchase.' }

  await ctx.fetch(`${base}/data/audit_log`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      actor_user_id: caller.id, actor_name: caller.name || 'Admin',
      action: 'Record purchase', detail: `${prod.name} x${qty} -> ${i.ownerName || i.patientUserId}`,
      at: new Date().toISOString(),
    }),
  })
  return { id: j.data?.id, productName: prod.name, unitPriceAtSale: prod.price, purchaseDate: today, estimatedFollowUpDate: followUp }
}
