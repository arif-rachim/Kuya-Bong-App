import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin, gotoRoute, expectToast, dialog } from './helpers'

/**
 * Admin patient management (US §9 assign package, §11 record purchase, §12
 * search/open profile). Drives everything through the Patients UI.
 */
test.describe('manggaleh — admin patients', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs admin credentials')

  const PATIENT_NAME = process.env.E2E_PATIENT_NAME ?? 'Maria Santos'

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
    await gotoRoute(page, 'admin/patients')
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible()
    await page.getByPlaceholder(/Search name/i).fill(PATIENT_NAME.split(' ')[0])
    await page.getByText(PATIENT_NAME).first().click()
    await expect(page).toHaveURL(/#\/admin\/patient\//)
  })

  test('assign a package to the patient', async ({ page }) => {
    await page.getByRole('button', { name: 'Assign Package' }).click()
    const d = dialog(page)
    await d.getByLabel(/Package definition/i).selectOption({ index: 1 })
    await d.getByRole('button', { name: 'Assign' }).click()
    await expectToast(page, /Package assigned/i)
  })

  test('record a product purchase for the patient', async ({ page }) => {
    await page.getByRole('button', { name: 'Record Purchase' }).click()
    const d = dialog(page)
    await d.getByLabel('Product').selectOption({ index: 1 })
    await d.getByRole('button', { name: 'Record Purchase' }).click()
    await expectToast(page, /Purchase recorded/i)
  })
})
