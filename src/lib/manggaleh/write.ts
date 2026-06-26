/**
 * Owner-scoped writes via the SDK (publishable key + the signed-in user). These
 * are the mutations a patient can perform on their own data; cross-user/admin
 * writes (assign package, transfer credit, manage catalog) need Functions.
 */
import { coll, COLLECTIONS } from './collections'
import { invokeFn } from './fns'
import { mgSignUp } from './auth'
import type { MgUser } from './auth'

/** Register a patient: auth signUp (auto signed-in) + provision their role & profile rows. */
export async function registerPatient(input: { name: string; email: string; password: string }): Promise<MgUser> {
  const user = await mgSignUp({ email: input.email.trim().toLowerCase(), password: input.password, name: input.name.trim() })
  // owner-scoped inserts run as the just-created user → owner column auto-set
  await coll(COLLECTIONS.appUsers).insert({ name: input.name.trim(), email: input.email.trim().toLowerCase(), role: 'patient', active: true })
  await coll(COLLECTIONS.profiles).insert({ family_group_id: user.id, active: true })
  return user
}

/** Insert an appointment for the signed-in patient (owner auto-set). Returns the new row id. */
export async function insertAppointment(input: {
  clinicId: string; serviceTypeId: string; therapistId: string; date: string; start: string; end: string
  forMemberId?: string; forMemberName: string; status: string
}): Promise<string> {
  const row = await coll(COLLECTIONS.appointments).insert({
    clinic_id: input.clinicId, service_type_id: input.serviceTypeId, therapist_id: input.therapistId,
    date: input.date, start: input.start, end: input.end,
    for_member_id: input.forMemberId ?? null, for_member_name: input.forMemberName,
    status: input.status, source: 'App',
  })
  return (row as any).id
}

/** Book via the server-side Function (enforces cross-patient/therapist conflict). Returns new id or throws. */
export async function bookAppointmentFn(input: {
  patientUserId: string; clinicId: string; serviceTypeId: string; therapistId: string
  date: string; start: string; end: string; forMemberId?: string; forMemberName: string
}): Promise<string> {
  const r = await invokeFn<{ id?: string; error?: string }>('book_appointment', input)
  if (r.error || !r.id) throw new Error(r.error || 'Could not book the appointment.')
  return r.id
}

/** Cancel one of the signed-in patient's own appointments. */
export async function cancelMyAppointment(id: string, reasonId?: string, note?: string) {
  await coll(COLLECTIONS.appointments).update(id, {
    status: 'CancelledByPatient', cancelled_by: 'patient',
    cancellation_reason_id: reasonId ?? null, cancellation_note: note ?? null,
  })
}

/** Reschedule one of the signed-in patient's own appointments. */
export async function rescheduleMyAppointment(id: string, t: { therapistId: string; clinicId: string; date: string; start: string; end: string }) {
  await coll(COLLECTIONS.appointments).update(id, {
    status: 'Rescheduled', therapist_id: t.therapistId, clinic_id: t.clinicId, date: t.date, start: t.start, end: t.end,
  })
}

/** Update the signed-in patient's own profile. */
export async function updateMyProfile(profileId: string, patch: { dateOfBirth?: string; gender?: string; address?: string; emergencyContact?: string }) {
  await coll(COLLECTIONS.profiles).update(profileId, {
    date_of_birth: patch.dateOfBirth, gender: patch.gender, address: patch.address, emergency_contact: patch.emergencyContact,
  })
}

/** Update the signed-in user's display name (app_users, owner-scoped). */
export async function updateMyName(appUserRowId: string, name: string) {
  await coll(COLLECTIONS.appUsers).update(appUserRowId, { name: name.trim() })
}

// ---------------- ADMIN WRITES (server-side Functions, service key) ----------------

/** Admin assigns a package to a patient (owned by them via x-act-as-user). Returns the new row + computed dates. */
export async function assignPackageFn(input: {
  patientUserId: string; definitionId: string; name: string; totalSessions: number; remaining: number
  validityDays: number; actorUserId?: string; actorName?: string; ownerName?: string
}): Promise<{ id: string; assignDate: string; expiryDate: string; status: string }> {
  const r = await invokeFn<{ id?: string; assignDate?: string; expiryDate?: string; status?: string; error?: string }>('assign_package', input)
  if (r.error || !r.id) throw new Error(r.error || 'Could not assign the package.')
  return { id: r.id, assignDate: r.assignDate!, expiryDate: r.expiryDate!, status: r.status! }
}

/** Admin corrects an assigned package's remaining sessions. Returns the recomputed status. */
export async function updatePackageRemainingFn(input: {
  packageId: string; remaining: number; name: string; actorUserId?: string; actorName?: string
}): Promise<{ status: string }> {
  const r = await invokeFn<{ ok?: boolean; status?: string; error?: string }>('update_package', input)
  if (r.error || !r.ok) throw new Error(r.error || 'Could not update the package.')
  return { status: r.status! }
}

/** Admin pulls back / deletes a wrongly assigned package (and its usage rows). */
export async function deletePackageFn(input: {
  packageId: string; name: string; actorUserId?: string; actorName?: string
}): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('delete_package', input)
  if (r.error || !r.ok) throw new Error(r.error || 'Could not delete the package.')
}

/** Add a child under the signed-in patient (owner-scoped). Returns the new row id. */
export async function addChildMember(userId: string, name: string): Promise<string> {
  const row = await coll(COLLECTIONS.family).insert({
    name: name.trim(), relationship: 'child', is_child: true, status: 'active',
    family_group_id: userId, parent_user_id: userId,
  })
  return (row as any).id
}
