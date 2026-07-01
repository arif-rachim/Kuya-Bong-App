import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient, gotoRoute, expectToast, dialog } from './helpers'
import { hasServiceKey, makeAppointment } from './fixtures'

/**
 * Reschedule / cancel an existing appointment (US §5). A fixture seeds a
 * confirmed appointment (owned by the patient, safely outside the 24h cutoff)
 * so each test acts on a known row.
 */
test.describe('manggaleh — patient appointments', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY to seed an appointment')

  let apptId = ''
  test.beforeEach(async ({ page }) => {
    apptId = await makeAppointment(creds.patient.email, { daysAhead: 6, start: '10:00', end: '13:00' })
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
  })

  test('the seeded appointment shows under Upcoming', async ({ page }) => {
    await gotoRoute(page, 'patient/appointments')
    await expect(page.getByRole('heading', { name: 'My Appointments' })).toBeVisible()
    await expect(page.getByText('E2E').first()).toBeVisible()
  })

  test('reschedule to another slot', async ({ page }) => {
    await gotoRoute(page, `patient/appointment/${apptId}`)
    await expect(page.getByRole('heading', { name: 'Appointment Details' })).toBeVisible()
    await page.getByRole('button', { name: 'Reschedule' }).click()

    const d = dialog(page, 'Choose a New Time')
    await expect(d).toBeVisible()
    if (await d.getByText('No times available').isVisible().catch(() => false)) {
      test.skip(true, 'no reschedule slots available for this therapist/clinic')
      return
    }
    await d.locator('.grid-cols-4 > button').first().click() // pick a date
    await d.locator('.grid-cols-3 > button').first().click()  // pick a time → opens confirm
    await dialog(page).getByRole('button', { name: 'Reschedule' }).click() // confirm dialog (topmost)
    await expectToast(page, /Appointment rescheduled\./i)
  })

  test('cancel with a reason', async ({ page }) => {
    await gotoRoute(page, `patient/appointment/${apptId}`)
    await page.getByRole('button', { name: 'Cancel Appointment' }).click()

    const d = dialog(page, 'Cancel Appointment')
    await expect(d).toBeVisible()
    // pick the first real cancellation reason (index 0 is the placeholder)
    await d.getByLabel('Cancellation reason').selectOption({ index: 1 })
    await d.getByRole('button', { name: 'Cancel appointment' }).click()
    await expectToast(page, /Appointment cancelled\./i)
    await expect(page).toHaveURL(/#\/patient\/appointments/)
  })
})
