import { test, expect } from '@playwright/test'
import {
  manggalehConfigured, hasPatientCreds, creds, runMarker,
  login, loginAsPatient, logoutFromProfile, gotoRoute,
} from './helpers'

/**
 * Auth against a live manggaleh tenant (User Stories §1–2).
 * Skips unless the build is manggaleh-wired AND patient credentials are provided.
 */
test.describe('manggaleh — auth', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build (VITE_USE_MANGGALEH=true)')
  test.skip(!hasPatientCreds, 'needs E2E_PATIENT_EMAIL / E2E_PATIENT_PASSWORD')

  test('login with valid patient credentials lands on Home', async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
  })

  test('login with a wrong password is rejected', async ({ page }) => {
    await login(page, creds.patient.email, `definitely-wrong-${runMarker()}`)
    // The app maps a 401 to "Incorrect email or password." and other failures to
    // a generic message; either way it must surface an error and stay on /login.
    await expect(page.getByText(/Incorrect email or password\.|Sign-in failed/)).toBeVisible()
    await expect(page).toHaveURL(/#\/login/)
  })

  test('a patient cannot reach admin screens (role separation)', async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    // Direct navigation to an admin route must bounce back to the patient area.
    await gotoRoute(page, 'admin/dashboard')
    await expect(page).toHaveURL(/#\/patient\/home/)
  })

  test('logout returns to the unauthenticated area', async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    await logoutFromProfile(page)
    // Session gone → the guarded route redirects out.
    await gotoRoute(page, 'patient/home')
    await expect(page).toHaveURL(/#\/welcome/)
  })
})

/**
 * Real registration creates a permanent account in the tenant, so it is opt-in
 * (E2E_ALLOW_SIGNUP=true) to avoid polluting a shared dev tenant by accident.
 */
test.describe('manggaleh — registration', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(process.env.E2E_ALLOW_SIGNUP !== 'true', 'set E2E_ALLOW_SIGNUP=true to create a real account')

  test('register a fresh patient → lands on Home', async ({ page }) => {
    const marker = runMarker()
    const name = `QA ${marker}`
    await gotoRoute(page, 'register')
    await page.getByLabel('Full name').fill(name)
    await page.getByLabel('Email').fill(`${marker}@e2e.example.com`)
    await page.getByLabel('Mobile number').fill(`+9715${Math.floor(Math.random() * 1e7)}`)
    await page.getByLabel('Password').fill('secret123')
    await page.getByRole('button', { name: /Continue to Verification/ }).click()

    // Without OTP required, registration auto-signs-in and hydrates to Home.
    // (With VITE_MANGGALEH_OTP=true the app routes to /verify-email instead.)
    await expect(page).toHaveURL(/#\/(patient\/home|verify-email)/, { timeout: 20_000 })
  })
})
