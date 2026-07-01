import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient, gotoRoute, uniq } from './helpers'
import { hasServiceKey, makeAppointment, makePackage } from './fixtures'

/**
 * Patient-facing business rules (US §5 cutoff, §9 package balance/expiry).
 * Fixtures seed the exact state so these are deterministic.
 */
test.describe('manggaleh — patient business rules', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY to seed exact state')

  test('reschedule & cancel are blocked within the 24h cutoff', async ({ page }) => {
    // A same-day appointment is always < 24h away → within the cutoff.
    const id = await makeAppointment(creds.patient.email, { daysAhead: 0, start: '23:00', end: '23:30' })
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    await gotoRoute(page, `patient/appointment/${id}`)
    await expect(page.getByRole('heading', { name: 'Appointment Details' })).toBeVisible()
    await expect(page.getByText(/less than .*hours away/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reschedule' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Cancel Appointment' })).toBeDisabled()
  })

  test('an assigned package shows its balance and expiry', async ({ page }) => {
    const name = `Pkg ${uniq()}`
    await makePackage(creds.patient.email, { total: 6, remaining: 4, daysValid: 60, name })
    await loginAsPatient(page, creds.patient.email, creds.patient.password)
    await gotoRoute(page, 'patient/packages')
    await expect(page.getByRole('heading', { name: 'My Packages' })).toBeVisible()
    // The card shows remaining and total in separate nodes ("4" + "of 6 sessions").
    const card = page.locator('div').filter({ hasText: name }).filter({ hasText: 'sessions' }).last()
    await expect(card).toBeVisible()
    await expect(card.getByText('of 6 sessions')).toBeVisible()
    await expect(card.getByText('4', { exact: true })).toBeVisible()
    await expect(card.getByText(/Valid until/i)).toBeVisible()
  })
})
