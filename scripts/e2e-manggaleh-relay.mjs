/**
 * Optional localhost relay for running the browser e2e suite against manggaleh
 * from a RESTRICTED-EGRESS environment (sandboxed CI/containers where the
 * headless browser cannot open a direct HTTPS connection to api.manggaleh.com,
 * even though server-side Node/curl can).
 *
 * It listens on localhost and forwards every request to the manggaleh API,
 * adding permissive CORS headers. Point the app at it for the test build:
 *
 *   node scripts/e2e-manggaleh-relay.mjs &                 # starts on :8788
 *   VITE_MANGGALEH_BASE_URL=http://localhost:8788 \
 *   VITE_USE_MANGGALEH=true ... npm run test:e2e
 *
 * In a normal environment the browser reaches api.manggaleh.com directly and
 * this relay is NOT needed — leave VITE_MANGGALEH_BASE_URL at the real API.
 *
 * Config via env: E2E_RELAY_PORT (default 8788), E2E_RELAY_TARGET
 * (default https://api.manggaleh.com). No secrets are handled here — the app
 * still sends its own publishable key / session token through the relay.
 */
import http from 'node:http'

const PORT = Number(process.env.E2E_RELAY_PORT ?? 8788)
const TARGET = (process.env.E2E_RELAY_TARGET ?? 'https://api.manggaleh.com').replace(/\/$/, '')

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': '*',
  'access-control-allow-headers': '*',
  'access-control-expose-headers': '*',
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    return res.end()
  }
  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  try {
    const headers = { ...req.headers }
    delete headers.host
    delete headers['content-length']
    const upstream = await fetch(TARGET + req.url, { method: req.method, headers, body })
    const buf = Buffer.from(await upstream.arrayBuffer())
    const out = { ...CORS }
    const ct = upstream.headers.get('content-type')
    if (ct) out['content-type'] = ct
    res.writeHead(upstream.status, out)
    res.end(buf)
  } catch (e) {
    res.writeHead(502, CORS)
    res.end(JSON.stringify({ relayError: String(e) }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`e2e manggaleh relay: http://127.0.0.1:${PORT} -> ${TARGET}`)
})
