import pw from '/home/erick/.npm-global/lib/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = 'https://realief-expert.netlify.app'
const OUT = 'docs/assets/shots'

const patientRoutes = [
  ['patient/home', 'patient-home'],
  ['patient/book', 'patient-book'],
  ['patient/appointments', 'patient-appointments'],
  ['patient/packages', 'patient-packages'],
  ['patient/family', 'patient-family'],
  ['patient/clinics', 'patient-clinics'],
  ['patient/profile', 'patient-profile'],
]

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function shootRoute(page, route, name, full) {
  await page.goto(`${BASE}/#/${route}`, { waitUntil: 'networkidle' })
  await sleep(1600)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
  console.log('shot', name)
}

const run = async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/brave-browser',
    args: ['--no-sandbox'],
  })
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 892 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()

  // Welcome (logged out)
  await page.goto(`${BASE}/#/welcome`, { waitUntil: 'networkidle' })
  await sleep(1600)
  await page.screenshot({ path: `${OUT}/welcome.png` })
  console.log('shot welcome')

  // Sign in as Patient
  await page.getByText('As Patient', { exact: true }).click()
  await sleep(1800)
  for (const [r, n] of patientRoutes) await shootRoute(page, r, n, n === 'patient-book')

  // Reset session -> sign in as Admin
  await page.evaluate(() => { localStorage.removeItem('kuya-bong-store') })
  await page.goto(`${BASE}/#/welcome`, { waitUntil: 'networkidle' })
  await sleep(1400)
  await page.getByText('As Admin', { exact: true }).click()
  await sleep(1800)
  for (const [r, n] of adminRoutes) await shootRoute(page, r, n, false)

  await browser.close()
  console.log('done')
}

run().catch((e) => { console.error(e); process.exit(1) })
