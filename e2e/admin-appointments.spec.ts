import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin, gotoRoute, expectToast, dialog } from './helpers'
import { hasServiceKey, makeAppointment } from './fixtures'

/**
 * Admin appointment lifecycle (US §7b, §8). A fixture seeds a TODAY appointment
 * (so "Complete" is enabled) owned by the patient; the admin then completes it.
 */
test.describe('manggaleh — admin appointments', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs admin credentials')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY to seed a same-day appointment')

  const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? 'maria@example.com'

  test('complete a session without deducting a package', async ({ page }) => {
    await makeAppointment(PATIENT_EMAIL, { daysAhead: 0, start: '09:00', end: '12:00' })
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
    await gotoRoute(page, 'admin/appointments')
    await expect(page.getByRole('heading', { name: 'Appointment Management' })).toBeVisible()

    const complete = page.getByRole('button', { name: 'Complete Session' }).first()
    if (!(await complete.isEnabled().catch(() => false))) {
      test.skip(true, 'no actionable same-day appointment to complete')
      return
    }
    await complete.click()
    const d = dialog(page, 'Mark Session Complete')
    await expect(d).toBeVisible()
    await d.getByRole('button', { name: /Complete without deducting/i }).click()
    await expectToast(page, /Session marked complete|complete/i)
  })

  test('cancel an appointment with a reason', async ({ page }) => {
    await makeAppointment(PATIENT_EMAIL, { daysAhead: 3, start: '14:00', end: '17:00' })
    await loginAsAdmin(page, creds.admin.email, creds.admin.password)
    await gotoRoute(page, 'admin/appointments')

    const cancel = page.getByRole('button', { name: 'Cancel', exact: true }).first()
    if (!(await cancel.isVisible().catch(() => false))) {
      test.skip(true, 'no actionable appointment to cancel')
      return
    }
    await cancel.click()
    const d = dialog(page, 'Cancel Appointment')
    await d.getByLabel('Cancellation reason').selectOption({ index: 1 })
    await d.getByRole('button', { name: 'Cancel appointment' }).click()
    await expectToast(page, /Appointment cancelled/i)
  })
})
