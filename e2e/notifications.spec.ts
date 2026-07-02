import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, creds, loginAsPatient, gotoRoute, uniq } from './helpers'
import { hasServiceKey, makeAnnouncement, deleteRow, svc } from './fixtures'

/**
 * Notifications (US §21). This app has NO native push (FCM/APNs is explicitly out
 * of scope per the blueprint / manggaleh plan); "notification" means the in-app
 * announcement badge on Home + the patient Announcements list. This asserts the
 * end-to-end delivery: a published announcement reaches the patient, and pulling
 * it (unpublish) removes it.
 */
test.describe('manggaleh — notifications / announcements', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds, 'needs patient credentials')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY to publish/pull an announcement')

  test('a published announcement reaches the patient; pulling it hides it', async ({ page }) => {
    const title = `Notify ${uniq()}`
    const id = await makeAnnouncement({ title, daysValid: 30, published: true })
    try {
      await loginAsPatient(page, creds.patient.email, creds.patient.password)

      // Home shows the in-app notification badge (a count of active announcements).
      await gotoRoute(page, 'patient/home')
      const bell = page.getByRole('button', { name: 'Announcements' })
      await expect(bell.getByText(/\d+/)).toBeVisible()

      // The announcement is delivered to the patient's Announcements list.
      await gotoRoute(page, 'patient/announcements')
      await expect(page.getByText(title)).toBeVisible()

      // Pulling it (unpublish) removes it from the patient's view after re-hydrate.
      await svc().data.from('announcements').update(id, { published: false })
      await page.reload()
      await expect(page.getByText(title)).toHaveCount(0)
    } finally {
      await deleteRow('announcements', id)
    }
  })
})
