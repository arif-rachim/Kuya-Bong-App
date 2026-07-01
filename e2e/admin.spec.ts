import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, creds, loginAsAdmin } from './helpers'

/**
 * Admin scope against manggaleh (User Stories §11, §12). Admin lists are served
 * by service-key Functions (admin_bootstrap, catalog reads), so reaching these
 * screens without error exercises the privileged read path. Read-only — no rows
 * created.
 */
test.describe('manggaleh — admin', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasAdminCreds, 'needs E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD')

  test('admin logs in and reaches Dashboard + Products', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

    await loginAsAdmin(page, creds.admin.email, creds.admin.password)

    // Products catalogue loads (admin_bootstrap / catalog read).
    await page.getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/#\/admin\/products/)

    await page.getByRole('link', { name: 'Patients' }).click()
    await expect(page).toHaveURL(/#\/admin\/patients/)

    // Ignore third-party asset load failures (e.g. font CDN under restricted
    // egress); assert only on app-level (JS) errors.
    const appErrors = consoleErrors.filter((e) => !/Failed to load resource/i.test(e))
    expect(appErrors, appErrors.join('\n')).toEqual([])
  })
})
