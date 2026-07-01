import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin, gotoRoute, expectToast } from './helpers'

/**
 * Admin configuration & master-only areas (US §6 calendar, §22/§26 sub-admins &
 * permissions, §23 reports, §28 audit). These exercise capability-gated routes
 * hydrating for a master admin. Deep mutations are covered where reliable; the
 * rest assert the screen + key controls render.
 */
test.describe('manggaleh — admin config', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs admin credentials (master admin for sub-admins/audit)')

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
  })

  test('settings screen toggles booking approval', async ({ page }) => {
    await gotoRoute(page, 'admin/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await page.getByText(/Require booking approval/i).click()
    await expectToast(page, /need approval|auto-confirm/i)
  })

  test('availability calendar loads', async ({ page }) => {
    await gotoRoute(page, 'admin/calendar')
    await expect(page.getByRole('heading', { name: 'Availability Calendar' })).toBeVisible()
    await expect(page.getByLabel('Therapist')).toBeVisible()
  })

  test('financial reports screen loads', async ({ page }) => {
    await gotoRoute(page, 'admin/reports')
    await expect(page.getByRole('heading', { name: 'Financial Reports' })).toBeVisible()
  })

  test('sub-admins & the 12 permissions render (master only)', async ({ page }) => {
    await gotoRoute(page, 'admin/sub-admins')
    if (!/#\/admin\/sub-admins/.test(page.url())) {
      test.skip(true, 'admin is not a master admin')
      return
    }
    await expect(page.getByRole('heading', { name: 'Sub-Admins' })).toBeVisible()
    await expect(page.getByText('Appointment Management')).toBeVisible()
    await expect(page.getByText('Manage Products')).toBeVisible()
  })

  test('audit log loads (master only)', async ({ page }) => {
    await gotoRoute(page, 'admin/audit')
    if (!/#\/admin\/audit/.test(page.url())) {
      test.skip(true, 'admin is not a master admin')
      return
    }
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()
  })
})
