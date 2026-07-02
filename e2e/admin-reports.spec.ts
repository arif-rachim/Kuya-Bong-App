import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin, gotoRoute } from './helpers'

/** Financial reports (US §23) + household report (US §27). Read-only screens. */
test.describe('manggaleh — reports & household', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs admin credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
  })

  test('financial reports reject a From date later than the To date (§23)', async ({ page }) => {
    await gotoRoute(page, 'admin/reports')
    await expect(page.getByRole('heading', { name: 'Financial Reports' })).toBeVisible()
    // Both DateField inputs expose aria-label "Select date" (From is first, To second).
    const dates = page.getByLabel('Select date')
    await dates.first().fill('2027-02-10')
    await dates.nth(1).fill('2027-02-01')
    await expect(page.getByText(/date must not be later than/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible()
  })

  test('household report loads and shows a selected household (§27)', async ({ page }) => {
    await gotoRoute(page, 'admin/household')
    await expect(page.getByRole('heading', { name: 'Household Report' })).toBeVisible()
    await page.getByLabel(/Household/i).selectOption({ index: 0 })
    await expect(page.getByText(/Total spending/i)).toBeVisible()
  })
})
