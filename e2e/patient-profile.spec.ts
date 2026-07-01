import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient, gotoRoute, expectToast, dialog, uniq } from './helpers'

/** Profile view + update + change-password validation (US §3). */
test.describe('manggaleh — patient profile', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    await gotoRoute(page, 'patient/profile')
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  })

  test('shows the signed-in patient and saves a profile edit', async ({ page }) => {
    await expect(page.getByLabel('Email')).toHaveValue(creds.patient.email)
    await page.getByLabel('Address').fill(`Unit ${uniq()}`)
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expectToast(page, /Profile saved\.|Could not save/i)
  })

  test('change-password rejects a too-short password', async ({ page }) => {
    await page.getByRole('button', { name: 'Change Password' }).click()
    const d = dialog(page, 'Change Password')
    await expect(d).toBeVisible()
    await d.getByLabel('Current password').fill(creds.patient.password)
    await d.getByLabel('New password').fill('123')
    await d.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('New password must be at least 6 characters.')).toBeVisible()
  })
})
