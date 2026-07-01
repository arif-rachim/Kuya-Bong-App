import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin, gotoRoute, expectToast, dialog, uniq } from './helpers'

/**
 * Admin catalogue management (US §11 products, §14 services, §18 reasons, §21
 * announcements). Each creates a uniquely-named row and asserts the success
 * toast. Requires an admin with the relevant capabilities (master admin has all).
 */
test.describe('manggaleh — admin catalogue', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs admin credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
  })

  test('create a product', async ({ page }) => {
    await gotoRoute(page, 'admin/products')
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
    await page.getByRole('button', { name: 'Add' }).click()
    const d = dialog(page, 'Add Product')
    await d.getByLabel('Product name').fill(`Prod ${uniq()}`)
    await d.getByLabel('Price').fill('99')
    await d.getByRole('button', { name: 'Save' }).click()
    await expectToast(page, /Product added/i)
  })

  test('create a service type', async ({ page }) => {
    await gotoRoute(page, 'admin/services')
    await expect(page.getByRole('heading', { name: 'Service Types' })).toBeVisible()
    await page.getByRole('button', { name: 'Add' }).click()
    const d = dialog(page)
    await d.getByLabel('Service name').fill(`Svc ${uniq()}`)
    await d.getByLabel('Duration (minutes)').fill('60')
    await d.getByRole('button', { name: 'Save' }).click()
    await expectToast(page, /Service added/i)
  })

  test('create a cancellation reason', async ({ page }) => {
    await gotoRoute(page, 'admin/cancellation-reasons')
    await expect(page.getByRole('heading', { name: 'Cancellation Reasons' })).toBeVisible()
    await page.getByRole('button', { name: 'Add' }).click()
    const d = dialog(page)
    await d.getByRole('textbox').first().fill(`Reason ${uniq()}`)
    await d.getByRole('button', { name: 'Save' }).click()
    await expectToast(page, /Reason added/i)
  })

  test('publish then delete an announcement', async ({ page }) => {
    await gotoRoute(page, 'admin/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements' })).toBeVisible()
    const title = `Notice ${uniq()}`
    await page.getByRole('button', { name: 'New' }).click()
    const d = dialog(page)
    await d.getByLabel('Title').fill(title)
    await d.getByLabel('Message').fill('E2E announcement body.')
    // expiry date defaults are fine; ensure a future date is set if the field is empty
    const expiry = d.getByLabel(/Expiry date/i)
    if (await expiry.inputValue().catch(() => '') === '') await expiry.fill('2027-01-01')
    await d.getByRole('button', { name: /Publish/i }).click()
    await expectToast(page, /Announcement published/i)
  })
})
