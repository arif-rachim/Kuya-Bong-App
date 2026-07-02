import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin, gotoRoute, dialog } from './helpers'

/** Master-data validation negatives (US §13/§20 clinics, §14 services, §18 reasons). */
test.describe('manggaleh — validation negatives', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs admin credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
  })

  test('clinic requires a name', async ({ page }) => {
    await gotoRoute(page, 'admin/clinic-settings')
    await page.getByRole('button', { name: 'Add' }).click()
    const d = dialog(page, 'Add Clinic')
    await d.getByRole('button', { name: 'Save' }).click() // empty name
    await expect(d.getByText(/Clinic name can.?t be empty/i)).toBeVisible()
  })

  test('service requires a name and a positive duration', async ({ page }) => {
    await gotoRoute(page, 'admin/services')
    await page.getByRole('button', { name: 'Add' }).click()
    const d = dialog(page)
    await d.getByRole('button', { name: 'Save' }).click() // empty name
    await expect(d.getByText(/Service name can.?t be empty/i)).toBeVisible()

    await d.getByLabel('Service name').fill('E2E Svc')
    await d.getByLabel('Duration (minutes)').fill('0')
    await d.getByRole('button', { name: 'Save' }).click()
    await expect(d.getByText(/Duration must be greater than 0/i)).toBeVisible()
  })

  test('cancellation reason requires text', async ({ page }) => {
    await gotoRoute(page, 'admin/cancellation-reasons')
    await page.getByRole('button', { name: 'Add' }).click()
    const d = dialog(page)
    await d.getByRole('button', { name: 'Save' }).click() // empty
    await expect(d.getByText(/Reason can.?t be empty/i)).toBeVisible()
  })
})
