import { chromium, webkit } from 'playwright'

const ENGINES = { chromium, webkit }
const BASE = 'http://localhost:4173'
const VIEWPORTS = [
  { name: '320', width: 320, height: 720 },
  { name: '360', width: 360, height: 740 },
]

const patientRoutes = [
  'patient/home', 'patient/book', 'patient/appointments', 'patient/packages',
  'patient/family', 'patient/friends', 'patient/clinics', 'patient/announcements', 'patient/profile',
]
const adminRoutes = [
  'admin/dashboard', 'admin/calendar', 'admin/appointments', 'admin/manual-booking',
  'admin/patients', 'admin/patient/u-pat-1', 'admin/packages', 'admin/products', 'admin/follow-ups',
  'admin/services', 'admin/therapists', 'admin/cancellation-reasons',
  'admin/announcements', 'admin/reports', 'admin/household',
  'admin/sub-admins', 'admin/audit', 'admin/settings',
]
const physioRoutes = ['physio/schedule', 'physio/profile']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const checkOverflow = async (page) =>
  page.evaluate(() => {
    const docW = document.documentElement.clientWidth
    const over = document.documentElement.scrollWidth - docW
    const offenders = []
    if (over > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.right > docW + 1.5 && r.left >= -1) {
          const cls = typeof el.className === 'string' ? el.className.slice(0, 50) : ''
          offenders.push(`${el.tagName.toLowerCase()}.${cls}`.trim())
        }
      }
    }
    return { over: Math.round(over), offenders: [...new Set(offenders)].slice(0, 4) }
  })

const engineName = process.env.PWBROWSER || 'chromium'
const run = async () => {
  const browser = await ENGINES[engineName].launch({ args: engineName === 'chromium' ? ['--no-sandbox'] : [] })
  let problems = 0
  console.log(`\n===== engine: ${engineName} =====`)
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    const visit = async (route) => {
      await page.goto(`${BASE}/#/${route}`, { waitUntil: 'networkidle' }).catch(() => {})
      await sleep(350)
      const { over, offenders } = await checkOverflow(page)
      const tag = over > 1 ? 'OVERFLOW' : 'ok'
      if (over > 1) { problems++; console.log(`[${vp.name}] ${tag} +${over}px  ${route}  ${offenders.join(' | ')}`) }
      else console.log(`[${vp.name}] ${tag}        ${route}`)
    }
    // patient
    await page.goto(`${BASE}/#/welcome`, { waitUntil: 'networkidle' })
    await sleep(400)
    await page.getByText('As Patient', { exact: true }).click().catch(() => {})
    await sleep(600)
    for (const r of patientRoutes) await visit(r)
    // admin
    await page.goto(`${BASE}/#/welcome`, { waitUntil: 'networkidle' }).catch(() => {})
    await sleep(400)
    await page.getByText('As Admin', { exact: true }).click().catch(() => {})
    await sleep(600)
    for (const r of adminRoutes) await visit(r)
    // physiotherapist (login via form)
    await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle' }).catch(() => {})
    await sleep(400)
    await page.fill('input[type="email"]', 'physio@reliefexpert.app').catch(() => {})
    await page.fill('input[type="password"]', 'physio123').catch(() => {})
    await page.getByRole('button', { name: /log in/i }).click().catch(() => {})
    await sleep(700)
    for (const r of physioRoutes) await visit(r)
    await ctx.close()
  }
  await browser.close()
  console.log(`\nDONE — ${problems} overflow finding(s)`)
}
run()
