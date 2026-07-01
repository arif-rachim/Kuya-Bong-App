import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin, gotoRoute, expectToast, dialog, uniq, rowCard } from './helpers'

/**
 * Admin CRUD depth beyond "create": edit / activate-deactivate / delete and their
 * confirm dialogs (US §11 products, §13/§20 clinics, §21 announcements).
 */
test.describe('manggaleh — admin CRUD depth', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs admin credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
  })

  test('clinic lifecycle: create → edit → deactivate → delete', async ({ page }) => {
    await gotoRoute(page, 'admin/clinic-settings')
    await expect(page.getByRole('heading', { name: 'Clinic Settings' })).toBeVisible()
    const name = `Clinic ${uniq()}`

    await page.getByRole('button', { name: 'Add' }).click()
    let d = dialog(page, 'Add Clinic')
    await d.getByLabel('Clinic name').fill(name)
    await d.getByLabel('Address').fill('1 Test St')
    await d.getByRole('button', { name: 'Save' }).click()
    await expectToast(page, /Clinic added/i)
    await expect(page.getByText(name)).toBeVisible()

    await rowCard(page, name).getByRole('button', { name: 'Edit' }).click()
    d = dialog(page, 'Edit Clinic')
    await d.getByLabel('Address').fill('2 Updated Ave')
    await d.getByRole('button', { name: 'Save' }).click()
    await expectToast(page, /Clinic updated/i)

    await rowCard(page, name).getByRole('button', { name: 'Deactivate' }).click()
    await dialog(page).getByRole('button', { name: 'Deactivate' }).click()
    await expectToast(page, /Clinic deactivated/i)

    // A freshly-created clinic has no linked records, so delete is allowed.
    await rowCard(page, name, 'Delete').getByRole('button', { name: 'Delete' }).click()
    await dialog(page).getByRole('button', { name: 'Delete' }).click()
    await expectToast(page, /Clinic deleted/i)
  })

  test('product: create → edit price → deactivate', async ({ page }) => {
    await gotoRoute(page, 'admin/products')
    const name = `Prod ${uniq()}`

    await page.getByRole('button', { name: 'Add' }).click()
    let d = dialog(page, 'Add Product')
    await d.getByLabel('Product name').fill(name)
    await d.getByLabel('Price').fill('50')
    await d.getByRole('button', { name: 'Save' }).click()
    await expectToast(page, /Product added/i)

    await rowCard(page, name).getByRole('button', { name: 'Edit' }).click()
    d = dialog(page, 'Edit Product')
    await d.getByLabel('Price').fill('75')
    await d.getByRole('button', { name: 'Save' }).click()
    await expectToast(page, /Product updated/i)

    await rowCard(page, name).getByRole('button', { name: 'Deactivate' }).click()
    await dialog(page).getByRole('button', { name: 'Deactivate' }).click()
    await expectToast(page, /Product deactivated/i)
  })

  test('announcement: publish → pull → delete', async ({ page }) => {
    await gotoRoute(page, 'admin/announcements')
    const title = `Notice ${uniq()}`

    await page.getByRole('button', { name: 'New' }).click()
    const d = dialog(page)
    await d.getByLabel('Title').fill(title)
    await d.getByLabel('Message').fill('E2E announcement body.')
    const expiry = d.getByLabel(/Expiry date/i)
    if ((await expiry.inputValue().catch(() => '')) === '') await expiry.fill('2027-01-01')
    await d.getByRole('button', { name: /Publish/i }).click()
    await expectToast(page, /Announcement published/i)

    await rowCard(page, title, 'Delete').getByRole('button', { name: 'Pull' }).click()
    await dialog(page).getByRole('button', { name: 'Pull' }).click()
    await expectToast(page, /Announcement pulled/i)

    await rowCard(page, title, 'Delete').getByRole('button', { name: 'Delete' }).click()
    await dialog(page).getByRole('button', { name: 'Delete' }).click()
    await expectToast(page, /Announcement deleted/i)
  })
})
