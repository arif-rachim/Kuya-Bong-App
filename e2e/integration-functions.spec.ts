import { test, expect } from '@playwright/test'
import { manggalehConfigured, hasPatientCreds, hasPatient2Creds, hasAdminCreds, creds, uniq } from './helpers'
import {
  hasServiceKey, authedClient, invokeAs, userIdByEmail, catalogIds,
  makeAppointment, makePackage, makeProduct, getRow, deleteRow, svc, daysFromNow,
  clearFriendsBetween, linkFriends,
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

  test('a product price change does not rewrite past purchases (§11)', async () => {
    const admin = await authedClient(creds.admin.email, creds.admin.password)
    const uid = await userIdByEmail(creds.patient.email)
    const productId = await makeProduct({ price: 100, name: `PriceTest ${uniq()}` })
    let purchaseId = ''
    try {
      const rec = await invokeAs<any>(admin, 'record_purchase', { patientUserId: uid, productId, quantity: 1 })
      expect(rec.id).toBeTruthy()
      expect(Number(rec.unitPriceAtSale)).toBe(100)
      purchaseId = rec.id

      await svc().data.from('products').update(productId, { price: 250 })      // catalogue price changes
      const sale = await getRow<any>('product_purchases', purchaseId)
      expect(Number(sale.unit_price_at_sale)).toBe(100)                        // historical sale unchanged
      const prod = await getRow<any>('products', productId)
      expect(Number(prod.price)).toBe(250)                                     // sanity: product did change
    } finally {
      if (purchaseId) await deleteRow('product_purchases', purchaseId, uid)
      await deleteRow('products', productId)
    }
  })
})

/** Friend credit transfer rules (US §25) — cross-user, at the Function layer. */
test.describe('manggaleh — credit transfer (Functions)', () => {
  test.skip(!manggalehConfigured, 'needs a manggaleh-wired build/config')
  test.skip(!hasServiceKey, 'needs MANGGALEH_SERVICE_KEY (setup + cleanup)')
  test.skip(!hasPatientCreds || !hasPatient2Creds, 'needs two patient credentials (E2E_PATIENT2_*)')

  test('transfer moves sessions to a confirmed friend and keeps the original expiry', async () => {
    const aUid = await userIdByEmail(creds.patient.email)
    const bUid = await userIdByEmail(creds.patient2.email)
    await clearFriendsBetween(aUid, bUid)
    await linkFriends(aUid, bUid)
    const pkgId = await makePackage(creds.patient.email, { total: 6, remaining: 6, daysValid: 45, name: `Xfer ${uniq()}` })
    const before = await getRow<any>('patient_packages', pkgId)
    const maria = await authedClient(creds.patient.email, creds.patient.password)
    let recipId = ''
    try {
      const r = await invokeAs<any>(maria, 'transfer_credit', { fromPackageId: pkgId, toUserId: bUid, sessions: 2 })
      expect(r.ok).toBe(true)
      expect(r.fromRemaining).toBe(4)
      recipId = r.recipientPackageId
      const from = await getRow<any>('patient_packages', pkgId)
      expect(Number(from.remaining)).toBe(4)                                    // sender decremented
      const recip = await getRow<any>('patient_packages', recipId)
      expect(recip.owner_user_id).toBe(bUid)                                    // owned by the recipient
      expect(Number(recip.remaining)).toBe(2)
      expect(String(recip.expiry_date).slice(0, 10)).toBe(String(before.expiry_date).slice(0, 10)) // expiry retained
      expect(String(recip.name)).toMatch(/from friend/i)
    } finally {
      if (recipId) await deleteRow('patient_packages', recipId, bUid)
      await deleteRow('patient_packages', pkgId, aUid)
      await clearFriendsBetween(aUid, bUid)
    }
  })

  test('transfer is rejected without a confirmed friendship', async () => {
    const aUid = await userIdByEmail(creds.patient.email)
    const bUid = await userIdByEmail(creds.patient2.email)
    await clearFriendsBetween(aUid, bUid)   // ensure NOT friends
    const pkgId = await makePackage(creds.patient.email, { total: 3, remaining: 3, daysValid: 45, name: `NoFriend ${uniq()}` })
    const maria = await authedClient(creds.patient.email, creds.patient.password)
    try {
      const r = await invokeAs<any>(maria, 'transfer_credit', { fromPackageId: pkgId, toUserId: bUid, sessions: 1 })
      expect(r.ok).toBeFalsy()
      expect(String(r.error)).toMatch(/confirmed friend/i)
    } finally {
      await deleteRow('patient_packages', pkgId, aUid)
    }
  })

  test('transfer is rejected for more sessions than remaining', async () => {
    const aUid = await userIdByEmail(creds.patient.email)
    const bUid = await userIdByEmail(creds.patient2.email)
    await clearFriendsBetween(aUid, bUid)
    await linkFriends(aUid, bUid)
    const pkgId = await makePackage(creds.patient.email, { total: 2, remaining: 1, daysValid: 45, name: `Short ${uniq()}` })
    const maria = await authedClient(creds.patient.email, creds.patient.password)
    try {
      const r = await invokeAs<any>(maria, 'transfer_credit', { fromPackageId: pkgId, toUserId: bUid, sessions: 5 })
      expect(r.ok).toBeFalsy()
      expect(String(r.error)).toMatch(/that many sessions/i)
    } finally {
      await deleteRow('patient_packages', pkgId, aUid)
      await clearFriendsBetween(aUid, bUid)
    }
  })
})
