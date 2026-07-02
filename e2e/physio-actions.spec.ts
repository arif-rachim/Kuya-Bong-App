import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPhysioCreds, hasPatientCreds, creds, loginAsPhysio, expectToast, dialog, rowCard } from './helpers'
import { hasServiceKey, therapistIds, makeAppointment, deleteRow, getRow, userIdByEmail, authedClient, invokeAs, daysFromNow } from './fixtures'

/**
 * Physiotherapist schedule + own-appointment actions (US §15/§30), now wired to
 * manggaleh via the physio_appointments / physio_update_appointment Functions.
 */
test.describe('manggaleh — physiotherapist schedule & actions', () => {
  test.describe.configure({ timeout: 60_000 })
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build')
  test.skip(!hasPhysioCreds || !hasPatientCreds, 'needs physio + patient credentials')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY to seed appointments')

  test('sees own assigned appointments, not another therapist\'s (§30)', async ({ page }) => {
    const { physioTherapistId, otherTherapistId } = await therapistIds(creds.physio.email)
    test.skip(!physioTherapistId, 'physio account is not linked to a therapist record')
    const uid = await userIdByEmail(creds.patient.email)
    const mine = await makeAppointment(creds.patient.email, { daysAhead: 8, start: '08:07', end: '08:37', therapistId: physioTherapistId })
    const other = await makeAppointment(creds.patient.email, { daysAhead: 8, start: '09:17', end: '09:47', therapistId: otherTherapistId })
    try {
      await loginAsPhysio(page, creds.physio.email, creds.physio.password)
      await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible()
      await expect(page.getByText('08:07').first()).toBeVisible()  // assigned to this physio
      await expect(page.getByText('09:17')).toHaveCount(0)         // another therapist's — hidden
    } finally {
      await deleteRow('appointments', mine, uid)
      await deleteRow('appointments', other, uid)
    }
  })

  test('cancels an assigned appointment and it persists (§30)', async ({ page }) => {
    const { physioTherapistId } = await therapistIds(creds.physio.email)
    test.skip(!physioTherapistId, 'physio not linked')
    const uid = await userIdByEmail(creds.patient.email)
    const id = await makeAppointment(creds.patient.email, { daysAhead: 8, start: '08:11', end: '08:41', therapistId: physioTherapistId })
    try {
      await loginAsPhysio(page, creds.physio.email, creds.physio.password)
      await rowCard(page, '08:11', 'Cancel').getByRole('button', { name: 'Cancel' }).click()
      const d = dialog(page, 'Cancel Appointment')
      await d.getByLabel('Cancellation reason').selectOption({ index: 1 })
      await d.getByRole('button', { name: 'Cancel appointment' }).click()
      await expectToast(page, /Appointment cancelled/i)
      const row = await getRow<any>('appointments', id)
      expect(row.status).toBe('CancelledByPhysiotherapist')  // persisted to the backend
    } finally {
      await deleteRow('appointments', id, uid)
    }
  })

  // Reschedule goes through physio_update_appointment, which (correctly) also
  // rejects patient overlaps the physio can't see via RLS — so the UI's first
  // offered slot isn't deterministic on a shared tenant. Assert the wired
  // Function directly against a known-free far-future slot.
  test('reschedules an assigned appointment and it persists (§30)', async () => {
    const { physioTherapistId } = await therapistIds(creds.physio.email)
    test.skip(!physioTherapistId, 'physio not linked')
    const uid = await userIdByEmail(creds.patient.email)
    const id = await makeAppointment(creds.patient.email, { daysAhead: 8, start: '08:13', end: '08:43', therapistId: physioTherapistId })
    const physio = await authedClient(creds.physio.email, creds.physio.password)
    try {
      const r = await invokeAs<any>(physio, 'physio_update_appointment', {
        appointmentId: id, action: 'reschedule', date: daysFromNow(20), start: '15:00', end: '18:00',
      })
      expect(r.ok, r.error).toBe(true)
      expect((await getRow<any>('appointments', id)).status).toBe('Rescheduled')
    } finally {
      await deleteRow('appointments', id, uid)
    }
  })
})
