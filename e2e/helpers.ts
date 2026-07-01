import { expect, type Page } from '@playwright/test'

/**
 * Shared helpers + environment gating for the e2e suite.
 *
 * The app uses a HashRouter, so every route is under `/#/...`. Navigation helpers
 * below encode that so specs read in terms of app routes, not URL fragments.
 */

/** True when the build under test is wired to a manggaleh tenant (not mock mode). */
export const manggalehConfigured =
  process.env.VITE_USE_MANGGALEH === 'true' &&
  !!process.env.VITE_MANGGALEH_TENANT &&
  !!process.env.VITE_MANGGALEH_API_KEY

/** Test-account credentials (only needed for the manggaleh specs). */
export const creds = {
  patient: {
    email: process.env.E2E_PATIENT_EMAIL ?? '',
    password: process.env.E2E_PATIENT_PASSWORD ?? '',
  },
  // A second, distinct patient — used by the RLS/isolation spec.
  patient2: {
    email: process.env.E2E_PATIENT2_EMAIL ?? '',
    password: process.env.E2E_PATIENT2_PASSWORD ?? '',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? '',
    password: process.env.E2E_ADMIN_PASSWORD ?? '',
  },
  // A sub-admin (adminLevel=sub) — used for capability-gating tests.
  subadmin: {
    email: process.env.E2E_SUBADMIN_EMAIL ?? '',
    password: process.env.E2E_SUBADMIN_PASSWORD ?? '',
  },
  physio: {
    email: process.env.E2E_PHYSIO_EMAIL ?? '',
    password: process.env.E2E_PHYSIO_PASSWORD ?? '',
  },
}

export const hasPatientCreds = !!creds.patient.email && !!creds.patient.password
export const hasPatient2Creds = !!creds.patient2.email && !!creds.patient2.password
export const hasAdminCreds = !!creds.admin.email && !!creds.admin.password
export const hasSubAdminCreds = !!creds.subadmin.email && !!creds.subadmin.password
export const hasPhysioCreds = !!creds.physio.email && !!creds.physio.password

/** A unique marker so rows this run creates can be spotted / cleaned up later. */
export function runMarker(): string {
  return `qa-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

/** Navigate to an app route (HashRouter → `/#/<path>`). */
export async function gotoRoute(page: Page, path: string): Promise<void> {
  const clean = path.replace(/^\/+/, '')
  await page.goto(`/#/${clean}`, { waitUntil: 'load' })
}

/** Open the Welcome screen (unauthenticated entry point). */
export async function gotoWelcome(page: Page): Promise<void> {
  await gotoRoute(page, 'welcome')
  await expect(page.getByRole('heading', { name: /Welcome to/i })).toBeVisible()
}

/**
 * Log in through the real Login form. Works in both mock and manggaleh mode
 * (the form branches internally on the flag). Resolves once a role landing
 * screen is reached.
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await gotoRoute(page, 'login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^Log In$/ }).click()
}

/** Log in and assert the patient Home is shown. */
export async function loginAsPatient(page: Page, email: string, password: string): Promise<void> {
  await login(page, email, password)
  await expect(page).toHaveURL(/#\/patient\/home/)
  await expect(page.getByRole('heading', { name: /^Hello,/ })).toBeVisible()
}

/** Log in and assert the admin Dashboard is shown. */
export async function loginAsAdmin(page: Page, email: string, password: string): Promise<void> {
  await login(page, email, password)
  await expect(page).toHaveURL(/#\/admin\/dashboard/)
}

/** Log in and assert the physiotherapist schedule is shown. */
export async function loginAsPhysio(page: Page, email: string, password: string): Promise<void> {
  await login(page, email, password)
  await expect(page).toHaveURL(/#\/physio\/schedule/)
}

/** Assert a toast with matching text appears (toasts auto-dismiss, so check fast). */
export async function expectToast(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10_000 })
}

/** A short unique suffix for names/emails created during a run. */
export function uniq(prefix = 'qa'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`
}

/** The top-most open dialog (Modal or Confirm both use role="dialog"). */
export function dialog(page: Page, name?: string | RegExp) {
  return name ? page.getByRole('dialog', { name }) : page.getByRole('dialog').last()
}

/** Click a button inside the current confirm/modal dialog. */
export async function clickInDialog(page: Page, buttonName: string | RegExp): Promise<void> {
  await dialog(page).getByRole('button', { name: buttonName }).click()
}

/**
 * The list card that contains `name` AND an action button — i.e. the specific
 * catalogue row for `name`. Deepest matching div = the Card itself.
 * `anchorButton` is any button known to live on the card (default "Edit").
 */
export function rowCard(page: Page, name: string, anchorButton: string | RegExp = 'Edit') {
  return page
    .locator('div')
    .filter({ hasText: name })
    .filter({ has: page.getByRole('button', { name: anchorButton }) })
    .last()
}

/** Log out from the patient Profile screen (Log Out → confirm). */
export async function logoutFromProfile(page: Page): Promise<void> {
  await gotoRoute(page, 'patient/profile')
  await page.getByRole('button', { name: 'Log Out' }).click()
  // Confirm dialog uses the label "Log out".
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await expect(page).toHaveURL(/#\/(welcome)?$/)
}
