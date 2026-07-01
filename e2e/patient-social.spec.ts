import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient, gotoRoute, expectToast, dialog, uniq } from './helpers'

/** Family linking & Friends (US §10, §25). */
test.describe('manggaleh — family', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    await gotoRoute(page, 'patient/family')
    await expect(page.getByRole('heading', { name: 'Family', exact: true })).toBeVisible()
  })

  test('add a child under the account', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Child' }).click()
    const d = dialog(page, 'Add Child')
    await expect(d).toBeVisible()
    await d.getByLabel("Child's name").fill(`Child ${uniq()}`)
    await d.getByRole('button', { name: 'Add' }).click()
    await expectToast(page, /Child added|Could not add/i)
  })

  test('linking an unregistered adult is rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'Link Adult' }).click()
    const d = dialog(page)
    await expect(d).toBeVisible()
    await d.getByRole('textbox').first().fill(`nobody-${uniq()}@example.com`)
    await d.getByRole('button', { name: 'Send Request' }).click()
    await expectToast(page, /Could not send the link request|isn't registered|not registered/i)
  })
})

test.describe('manggaleh — friends', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')

  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    await gotoRoute(page, 'patient/friends')
    await expect(page.getByRole('heading', { name: 'Friends', exact: true })).toBeVisible()
  })

  test('friend request to an unregistered user is rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click()
    const d = dialog(page)
    await expect(d).toBeVisible()
    await d.getByRole('textbox').first().fill(`nobody-${uniq()}@example.com`)
    await d.getByRole('button', { name: /Send request/i }).click()
    await expectToast(page, /Could not send the friend request|isn't registered|not registered/i)
  })
})
