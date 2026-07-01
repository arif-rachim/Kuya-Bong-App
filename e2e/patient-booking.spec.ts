import { test, expect, type Page } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient, gotoRoute } from './helpers'

/**
 * The core patient journey against manggaleh: the booking wizard end-to-end
 * (User Stories §4, §16, §17). Booking goes through the server-side
 * `book_appointment` Function (conflict-checked), so a green run proves the
 * SDK + Function + hydrate seam works, not just the UI.
 *
 * NOTE: this creates a real appointment row in the tenant. It is the intended
 * integration assertion; clean up test appointments periodically (or run against
 * a disposable dev tenant).
 */
test.describe('manggaleh — patient booking', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')

  // A card in the service/clinic steps is a <button> that contains an <h3>.
  const cardButtons = (page: Page) =>
    page.getByRole('button').filter({ has: page.getByRole('heading', { level: 3 }) })

  test('book: service → clinic → date → time → review → confirm', async ({ page }) => {
    await loginAsPatient(page, creds.patient.email, creds.patient.password)

    await gotoRoute(page, 'patient/book')

    // Step 1 — Service
    await expect(page.getByText('Choose Service')).toBeVisible()
    await cardButtons(page).first().click()

    // Step 2 — Clinic
    await expect(page.getByText('Choose Clinic')).toBeVisible()
    await cardButtons(page).first().click()

    // Step 3 — Date (grid of upcoming days; first available)
    await expect(page.getByText('Select Date')).toBeVisible()
    await page.locator('div.grid-cols-4 > button').first().click()

    // Step 4 — Time (first open start)
    await expect(page.getByText('Choose Time')).toBeVisible()
    await page.getByRole('button', { name: /\d{2}:\d{2}/ }).first().click()

    // Review
    await expect(page.getByText('Booking Summary')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm Booking' }).click()

    // Confirmation (goes through book_appointment on manggaleh)
    await expect(page.getByRole('heading', { name: 'Booking Confirmed!' })).toBeVisible({ timeout: 20_000 })

    // And it shows up under upcoming visits.
    await page.getByRole('button', { name: 'View My Appointments' }).click()
    await expect(page.getByText('My Appointments')).toBeVisible()
  })
})
