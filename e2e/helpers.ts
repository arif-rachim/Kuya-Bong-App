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
}

export const hasPatientCreds = !!creds.patient.email && !!creds.patient.password
export const hasPatient2Creds = !!creds.patient2.email && !!creds.patient2.password
export const hasAdminCreds = !!creds.admin.email && !!creds.admin.password

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

/** Log out from the patient Profile screen (Log Out → confirm). */
export async function logoutFromProfile(page: Page): Promise<void> {
  await gotoRoute(page, 'patient/profile')
  await page.getByRole('button', { name: 'Log Out' }).click()
  // Confirm dialog uses the label "Log out".
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await expect(page).toHaveURL(/#\/(welcome)?$/)
}
