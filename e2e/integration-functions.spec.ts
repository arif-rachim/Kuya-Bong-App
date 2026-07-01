import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, hasAdminCreds, creds, uniq } from './helpers'
import {
  hasServiceKey, authedClient, invokeAs, userIdByEmail, catalogIds,
  makeAppointment, makePackage, deleteRow, svc, daysFromNow,
} from './fixtures'

/**
 * Function-level integration (server-side rules that the UI hides rather than
 * surfaces as an error): booking conflict prevention (US §4/§17) and package
 * deduction/guards on completion (§8/§9). These call the deployed serverless
 * Functions exactly as the app's invokeFn() does — sign in with the publishable
 * key, then invoke with __callerToken — so they assert the real backend rule.
 */
test.describe('manggaleh — server rules (Functions)', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build/config')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY (setup + cleanup)')
  test.skip(!hasPatientCreds || !hasAdminCreds, 'needs patient + admin credentials')

  test('book_appointment rejects an overlapping slot on the same therapist (§4/§17)', async () => {
    const patient = await authedClient(creds.patient.email, creds.patient.password)
    const uid = await userIdByEmail(creds.patient.email)
    const { clinicId, serviceId, therapistId } = await catalogIds()
    const date = daysFromNow(13)
    const book = (start: string, end: string) => invokeAs<any>(patient, 'book_appointment', {
      patientUserId: uid, clinicId, serviceTypeId: serviceId, therapistId, date, start, end, forMemberName: 'E2E-conflict',
    })

    const first = await book('08:00', '09:00')
    if (first?.error) { test.skip(true, `precondition slot busy: ${first.error}`); return }
    try {
      const second = await book('08:30', '09:30') // overlaps the first, same therapist
      expect(second.id, 'overlapping booking must not create a row').toBeFalsy()
      expect(String(second.error)).toMatch(/already booked|overlap/i)
    } finally {
      await deleteRow('appointments', first.id, uid)
    }
  })

  test('book_appointment rejects a patient double-booking themselves across therapists (§17)', async () => {
    const patient = await authedClient(creds.patient.email, creds.patient.password)
    const uid = await userIdByEmail(creds.patient.email)
    const { clinicId, serviceId } = await catalogIds()
    const ths = (await svc().data.from<any>('therapists').list({ limit: 50 })).filter((t: any) => t.active !== false)
    if (ths.length < 2) { test.skip(true, 'need two therapists for a cross-therapist overlap'); return }
    const date = daysFromNow(14)
    const book = (thId: string, start: string, end: string) => invokeAs<any>(patient, 'book_appointment', {
      patientUserId: uid, clinicId, serviceTypeId: serviceId, therapistId: thId, date, start, end, forMemberName: 'E2E-overlap',
    })

    const first = await book(ths[0].id, '08:00', '09:00')
    if (first?.error) { test.skip(true, `precondition slot busy: ${first.error}`); return }
    try {
      const second = await book(ths[1].id, '08:30', '09:30') // different therapist, same patient → overlap
      expect(second.id).toBeFalsy()
      expect(String(second.error)).toMatch(/already have an appointment|overlap/i)
    } finally {
      await deleteRow('appointments', first.id, uid)
    }
  })

  test('completing a session deducts exactly one from the chosen package (§8)', async () => {
    const admin = await authedClient(creds.admin.email, creds.admin.password)
    const uid = await userIdByEmail(creds.patient.email)
    const pkgId = await makePackage(creds.patient.email, { total: 3, remaining: 3, daysValid: 60, name: `Pkg ${uniq()}` })
    const apptId = await makeAppointment(creds.patient.email, { daysAhead: 15, start: '08:00', end: '09:00' })
    try {
      const r = await invokeAs<any>(admin, 'set_appointment_status', { appointmentId: apptId, action: 'complete', patientPackageId: pkgId })
      expect(r.ok).toBe(true)
      expect(r.remaining).toBe(2)
      // persisted, not just echoed
      const pkg = await svc().data.from<any>('patient_packages').get(pkgId)
      expect(Number(pkg.remaining)).toBe(2)
    } finally {
      await deleteRow('appointments', apptId, uid)
      await deleteRow('patient_packages', pkgId, uid)
    }
  })

  test('completion is blocked when the package has no sessions left (§9)', async () => {
    const admin = await authedClient(creds.admin.email, creds.admin.password)
    const uid = await userIdByEmail(creds.patient.email)
    const pkgId = await makePackage(creds.patient.email, { total: 1, remaining: 0, daysValid: 60, name: `Pkg0 ${uniq()}` })
    const apptId = await makeAppointment(creds.patient.email, { daysAhead: 16, start: '08:00', end: '09:00' })
    try {
      const r = await invokeAs<any>(admin, 'set_appointment_status', { appointmentId: apptId, action: 'complete', patientPackageId: pkgId })
      expect(r.ok).toBeFalsy()
      expect(String(r.error)).toMatch(/no sessions left/i)
    } finally {
      await deleteRow('appointments', apptId, uid)
      await deleteRow('patient_packages', pkgId, uid)
    }
  })

  test('completion is blocked when the package is expired (§9)', async () => {
    const admin = await authedClient(creds.admin.email, creds.admin.password)
    const uid = await userIdByEmail(creds.patient.email)
    const pkgId = await makePackage(creds.patient.email, { total: 2, remaining: 2, daysValid: -1, name: `PkgX ${uniq()}` })
    const apptId = await makeAppointment(creds.patient.email, { daysAhead: 17, start: '08:00', end: '09:00' })
    try {
      const r = await invokeAs<any>(admin, 'set_appointment_status', { appointmentId: apptId, action: 'complete', patientPackageId: pkgId })
      expect(r.ok).toBeFalsy()
      expect(String(r.error)).toMatch(/expired/i)
    } finally {
      await deleteRow('appointments', apptId, uid)
      await deleteRow('patient_packages', pkgId, uid)
    }
  })
})
