import { test, expect } from '@playwright/test'
import {
  manggalehConfigured, creds, gotoRoute,
  hasPatientCreds, hasAdminCreds, hasPhysioCreds,
  loginAsPatient, loginAsAdmin, loginAsPhysio,
} from './helpers'

/** Login + role routing across all roles, and cross-role route guards (US §2). */
test.describe('manggaleh — roles & guards', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')

  test('admin logs in → dashboard', async ({ page }) => {
    test.skip(!hasAdminCreds, 'needs admin creds')
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
  })

  test('physiotherapist logs in → schedule', async ({ page }) => {
    test.skip(!hasPhysioCreds, 'needs physio creds')
    await loginAsPhysio(page, creds.physio.email, creds.physio.password)
    await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible()
  })

  test('a patient cannot reach the physiotherapist area', async ({ page }) => {
    test.skip(!hasPatientCreds, 'needs patient creds')
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    await gotoRoute(page, 'physio/schedule')
    await expect(page).toHaveURL(/#\/patient\/home/)
  })

  test('a physiotherapist cannot reach the admin area', async ({ page }) => {
    test.skip(!hasPhysioCreds, 'needs physio creds')
    await loginAsPhysio(page, creds.physio.email, creds.physio.password)
    await gotoRoute(page, 'admin/dashboard')
    await expect(page).not.toHaveURL(/#\/admin/)
  })
})

/** Forgot-password entry (US §2). In manggaleh mode the app returns a neutral
 *  message that never leaks whether the email exists. */
test.describe('manggaleh — forgot password', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')

  test('requesting a reset shows a neutral confirmation', async ({ page }) => {
    await gotoRoute(page, 'forgot')
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible()
    await page.getByLabel('Email').fill('someone@example.com')
    await page.getByRole('button', { name: /Send Reset Link/i }).click()
    await expect(page.getByText(/we've sent a password-reset link|If an account exists/i)).toBeVisible()
  })
})
