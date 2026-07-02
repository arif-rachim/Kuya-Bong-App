import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasAdminCreds, hasPatient2Creds, creds, login } from './helpers'
import { hasServiceKey, authedClient, invokeAs, userIdByEmail } from './fixtures'

/**
 * A deactivated user must not be able to sign in (US §29). Previously the block
 * existed only in the mock store; now hydrate signs out an inactive account.
 * Deactivates a spare account for the duration of the test, then restores it.
 */
test.describe('manggaleh — deactivated login blocked', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasServiceKey || !hasAdminCreds || !hasPatient2Creds, 'needs service key + master admin + a spare patient')

  test('a deactivated user is blocked at login', async ({ page }) => {
    const admin = await authedClient(creds.admin.email, creds.admin.password)
    const bUid = await userIdByEmail(creds.patient2.email)
    await invokeAs(admin, 'set_user_active', { targetUserId: bUid, active: false })
    try {
      await login(page, creds.patient2.email, creds.patient2.password)
      await expect(page.getByText(/deactivated/i)).toBeVisible()
      await expect(page).toHaveURL(/#\/login/)
    } finally {
      await invokeAs(admin, 'set_user_active', { targetUserId: bUid, active: true })
    }
  })
})
