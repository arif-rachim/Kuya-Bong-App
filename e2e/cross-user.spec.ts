import { test, expect } from '@playwright/test'
import {
  manggalehConfigured, hasPatientCreds, hasPatient2Creds, creds,
  loginAsPatient, gotoRoute, expectToast, dialog, rowCard,
} from './helpers'
import { hasServiceKey, userIdByEmail, clearFriendsBetween, clearFamilyLinks, ensureProfile } from './fixtures'

/**
 * Cross-user CONSENT flows that need two live sessions at once (US §10 family
 * adult-link, §25 friend request). Runs two browser contexts — one per user —
 * and drives the real UI on both. Prior links between the two are cleared via
 * the service key so each run starts from a known state.
 */
const PORT = process.env.E2E_PORT ?? 4173
// Manually-created contexts do NOT inherit `use` options (baseURL / ignoreHTTPSErrors),
// so set them explicitly. Two logins + cross-session updates need a longer budget.
const CTX = { baseURL: `http://localhost:${PORT}`, viewport: { width: 390, height: 800 }, ignoreHTTPSErrors: true }

test.describe('manggaleh — cross-user (two sessions)', () => {
  test.describe.configure({ timeout: 90_000 })
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPatientCreds || !hasPatient2Creds, 'needs two patient credentials (E2E_PATIENT2_*)')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY to reset link state')

  test('friends: request (A) → accept (B) → both confirmed', async ({ browser }) => {
    const aUid = await userIdByEmail(creds.patient.email)
    const bUid = await userIdByEmail(creds.patient2.email)
    await clearFriendsBetween(aUid, bUid)

    const ctxA = await browser.newContext(CTX)
    const ctxB = await browser.newContext(CTX)
    const A = await ctxA.newPage()
    const B = await ctxB.newPage()
    try {
      await loginAsPatient(A, creds.patient.email, creds.patient.password)
      await loginAsPatient(B, creds.patient2.email, creds.patient2.password)

      // A → send request to B by email
      await gotoRoute(A, 'patient/friends')
      await A.getByRole('button', { name: 'Add' }).click()
      await dialog(A).getByRole('textbox').first().fill(creds.patient2.email)
      await dialog(A).getByRole('button', { name: /Send request/i }).click()
      await expectToast(A, /Friend request sent/i)

      // B → accept Maria's incoming request
      await gotoRoute(B, 'patient/friends')
      await B.reload()
      const req = rowCard(B, 'Maria Santos', 'Accept')
      await expect(req).toBeVisible()
      await req.getByRole('button', { name: 'Accept' }).click()
      await expectToast(B, /Friend added/i)

      // A → reloads and now sees Ahmed among friends
      await gotoRoute(A, 'patient/friends')
      await A.reload()
      await expect(A.getByText('Ahmed Rahman').first()).toBeVisible()
    } finally {
      await ctxA.close()
      await ctxB.close()
      await clearFriendsBetween(aUid, bUid)
    }
  })

  test('family: link-adult (A) → accept (B) → linked', async ({ browser }) => {
    const bUid = await userIdByEmail(creds.patient2.email)
    await clearFamilyLinks(bUid)
    // The Family list keys off the inviter's profile.familyGroupId; ensure it exists.
    await ensureProfile(creds.patient.email)

    const ctxA = await browser.newContext(CTX)
    const ctxB = await browser.newContext(CTX)
    const A = await ctxA.newPage()
    const B = await ctxB.newPage()
    try {
      await loginAsPatient(A, creds.patient.email, creds.patient.password)
      await loginAsPatient(B, creds.patient2.email, creds.patient2.password)

      // A → link B as an adult family member
      await gotoRoute(A, 'patient/family')
      await A.getByRole('button', { name: 'Link Adult' }).click()
      await dialog(A).getByRole('textbox').first().fill(creds.patient2.email)
      await dialog(A).getByRole('button', { name: 'Send Request' }).click()
      await expectToast(A, /Link request sent|Awaiting approval/i)

      // B → accept the incoming link request (card → confirm dialog)
      await gotoRoute(B, 'patient/family')
      await B.reload()
      const req = rowCard(B, 'Maria Santos', 'Accept')
      await expect(req).toBeVisible()
      await req.getByRole('button', { name: 'Accept' }).click()
      await dialog(B).getByRole('button', { name: 'Accept' }).click()
      await expectToast(B, /now linked/i)

      // A → reloads and sees Ahmed as an active family member
      await gotoRoute(A, 'patient/family')
      await A.reload()
      await expect(A.getByText('Ahmed Rahman').first()).toBeVisible()
    } finally {
      await ctxA.close()
      await ctxB.close()
      await clearFamilyLinks(bUid)
    }
  })
})
