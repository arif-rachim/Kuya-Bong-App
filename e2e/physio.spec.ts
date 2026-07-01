import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPhysioCreds, creds, loginAsPhysio } from './helpers'

/** Physiotherapist schedule (US §15, §30). Read-only load check. */
test.describe('manggaleh — physiotherapist', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPhysioCreds, 'needs E2E_PHYSIO_EMAIL / E2E_PHYSIO_PASSWORD')

  test('My Schedule loads for the physiotherapist', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

    await loginAsPhysio(page, creds.physio.email, creds.physio.password)
    await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible()

    const appErrors = consoleErrors.filter((e) => !/Failed to load resource/i.test(e))
    expect(appErrors, appErrors.join('\n')).toEqual([])
  })
})
