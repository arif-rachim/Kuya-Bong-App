import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient } from './helpers'

/**
 * Read-side hydration: after logging in, each patient tab loads its own data
 * from manggaleh without error (User Stories §3, §5, §9, §12). Purely
 * navigational + assertive — creates no rows.
 */
test.describe('manggaleh — patient navigation', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')

  test('bottom-nav tabs each load their screen', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

    await loginAsPatient(page, creds.patient.email, creds.patient.password)

    await page.getByRole('link', { name: 'Visits' }).click()
    await expect(page).toHaveURL(/#\/patient\/appointments/)
    await expect(page.getByText('My Appointments')).toBeVisible()

    await page.getByRole('link', { name: 'Packages' }).click()
    await expect(page).toHaveURL(/#\/patient\/packages/)

    await page.getByRole('link', { name: 'Book' }).click()
    await expect(page).toHaveURL(/#\/patient\/book/)
    await expect(page.getByText('Choose Service')).toBeVisible()

    await page.getByRole('link', { name: 'Profile' }).click()
    await expect(page).toHaveURL(/#\/patient\/profile/)

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL(/#\/patient\/home/)
    await expect(page.getByRole('heading', { name: /^Hello,/ })).toBeVisible()

    // Data hydration should not surface app-level (JS) errors. Third-party asset
    // failures (e.g. the Material Symbols font CDN when egress is restricted) are
    // environment noise, not app bugs — filter them out.
    const appErrors = consoleErrors.filter((e) => !/Failed to load resource/i.test(e))
    expect(appErrors, appErrors.join('\n')).toEqual([])
  })
})
