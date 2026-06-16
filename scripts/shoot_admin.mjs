import pw from '/home/erick/.npm-global/lib/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = 'https://realief-expert.netlify.app'
const OUT = 'docs/assets/shots'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const adminRoutes = [
  ['admin/dashboard', 'admin-dashboard'],
  ['admin/calendar', 'admin-calendar'],
  ['admin/appointments', 'admin-appointments'],
  ['admin/manual-booking', 'admin-manual-booking'],
  ['admin/patients', 'admin-patients'],
  ['admin/packages', 'admin-packages'],
  ['admin/products', 'admin-products'],
  ['admin/follow-ups', 'admin-followups'],
  ['admin/services', 'admin-services'],
  ['admin/therapists', 'admin-therapists'],
  ['admin/cancellation-reasons', 'admin-cancellation-reasons'],
]

const run = async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/brave-browser', args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  await page.goto(`${BASE}/#/welcome`, { waitUntil: 'networkidle' })
  await sleep(2000)
  // robust click: button by accessible name
  const btn = page.getByRole('button', { name: /As Admin/i })
  await btn.waitFor({ state: 'visible', timeout: 20000 })
  await btn.click()
  await sleep(2500)
  console.log('logged in as admin, url=', page.url())

  for (const [r, nm] of adminRoutes) {
    await page.goto(`${BASE}/#/${r}`, { waitUntil: 'networkidle' })
    await sleep(1700)
    await page.screenshot({ path: `${OUT}/${nm}.png` })
    console.log('shot', nm)
  }
  await browser.close()
  console.log('done')
}
run().catch((e) => { console.error(e); process.exit(1) })
