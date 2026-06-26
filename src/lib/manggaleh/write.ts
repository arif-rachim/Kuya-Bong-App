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
  date: string; start: string; end: string; forMemberId?: string; forMemberName: string; source?: string
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

/** Admin records a product purchase for a patient (price snapshot server-side). Returns the new row + snapshot. */
export async function recordPurchaseFn(input: {
  patientUserId: string; productId: string; quantity: number; followUpDays?: number; notes?: string
  actorUserId?: string; actorName?: string; ownerName?: string
}): Promise<{ id: string; productName: string; unitPriceAtSale: number; purchaseDate: string; estimatedFollowUpDate: string | null }> {
  const r = await invokeFn<{ id?: string; productName?: string; unitPriceAtSale?: string | number; purchaseDate?: string; estimatedFollowUpDate?: string | null; error?: string }>('record_purchase', input)
  if (r.error || !r.id) throw new Error(r.error || 'Could not record the purchase.')
  return { id: r.id, productName: r.productName!, unitPriceAtSale: Number(r.unitPriceAtSale), purchaseDate: r.purchaseDate!, estimatedFollowUpDate: r.estimatedFollowUpDate ?? null }
}

/** Admin appointment lifecycle on any patient's appointment. "complete" can deduct a package session. */
export async function setAppointmentStatusFn(input: {
  appointmentId: string; action: 'approve' | 'reject' | 'complete' | 'noshow' | 'cancel'
  patientPackageId?: string; reasonId?: string; note?: string; actorUserId?: string; actorName?: string
}): Promise<{ status: string; remaining?: number }> {
  const r = await invokeFn<{ ok?: boolean; status?: string; remaining?: number; error?: string }>('set_appointment_status', input)
  if (r.error || !r.ok) throw new Error(r.error || 'Could not update the appointment.')
  return { status: r.status!, remaining: r.remaining }
}

/** Admin reschedules any patient's appointment (conflict-checked server-side). */
export async function adminRescheduleFn(input: {
  appointmentId: string; therapistId: string; clinicId: string; date: string; start: string; end: string
  actorUserId?: string; actorName?: string
}): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('admin_reschedule_appointment', input)
  if (r.error || !r.ok) throw new Error(r.error || 'Could not reschedule the appointment.')
}

// ---------------- CATALOG MANAGEMENT (generic admin writer) ----------------

type CatalogCollection =
  | 'clinics' | 'service_types' | 'therapists' | 'products'
  | 'cancellation_reasons' | 'announcements' | 'package_definitions' | 'therapist_availability'

/** Insert/update/delete a shared catalog row via the admin-guarded Function. */
async function catalogWrite(input: {
  collection: CatalogCollection; op: 'insert' | 'update' | 'delete'
  id?: string; data?: Record<string, unknown>; label?: string
}): Promise<{ id?: string }> {
  const r = await invokeFn<{ id?: string; ok?: boolean; error?: string }>('catalog_write', input)
  if (r.error) throw new Error(r.error)
  return { id: r.id }
}

// Clinics
export const createClinicFn = (d: { name: string; address?: string }) =>
  catalogWrite({ collection: 'clinics', op: 'insert', data: { name: d.name, address: d.address ?? '', active: true }, label: 'Create clinic' }).then((r) => r.id!)
export const updateClinicFn = (id: string, patch: { name?: string; address?: string }) =>
  catalogWrite({ collection: 'clinics', op: 'update', id, data: patch, label: 'Update clinic' })
export const setClinicActiveFn = (id: string, active: boolean) =>
  catalogWrite({ collection: 'clinics', op: 'update', id, data: { active }, label: 'Toggle clinic active' })
export const deleteClinicFn = (id: string) =>
  catalogWrite({ collection: 'clinics', op: 'delete', id, label: 'Delete clinic' })

// Service types
export const createServiceFn = (d: { name: string; durationMinutes: number; notes?: string }) =>
  catalogWrite({ collection: 'service_types', op: 'insert', data: { name: d.name, duration_minutes: d.durationMinutes, notes: d.notes ?? null, active: true }, label: 'Create service' }).then((r) => r.id!)
export const updateServiceFn = (id: string, patch: { name?: string; durationMinutes?: number; notes?: string }) =>
  catalogWrite({ collection: 'service_types', op: 'update', id, data: { name: patch.name, duration_minutes: patch.durationMinutes, notes: patch.notes }, label: 'Update service' })
export const setServiceActiveFn = (id: string, active: boolean) =>
  catalogWrite({ collection: 'service_types', op: 'update', id, data: { active }, label: 'Toggle service active' })

// Therapists
export const createTherapistFn = (name: string) =>
  catalogWrite({ collection: 'therapists', op: 'insert', data: { name, active: true }, label: 'Create therapist' }).then((r) => r.id!)
export const updateTherapistFn = (id: string, name: string) =>
  catalogWrite({ collection: 'therapists', op: 'update', id, data: { name }, label: 'Update therapist' })
export const setTherapistActiveFn = (id: string, active: boolean) =>
  catalogWrite({ collection: 'therapists', op: 'update', id, data: { active }, label: 'Toggle therapist active' })

// Products
export const createProductFn = (d: { name: string; category: string; price: number; notes?: string; images?: string[] }) =>
  catalogWrite({ collection: 'products', op: 'insert', data: { name: d.name, category: d.category, price: d.price, notes: d.notes ?? null, image_object_ids: d.images ?? [], active: true }, label: 'Create product' }).then((r) => r.id!)
export const updateProductFn = (id: string, patch: { name?: string; category?: string; price?: number; notes?: string; images?: string[] }) =>
  catalogWrite({ collection: 'products', op: 'update', id, data: { name: patch.name, category: patch.category, price: patch.price, notes: patch.notes, image_object_ids: patch.images }, label: 'Update product' })
export const setProductActiveFn = (id: string, active: boolean) =>
  catalogWrite({ collection: 'products', op: 'update', id, data: { active }, label: 'Toggle product active' })

// Cancellation reasons
export const createReasonFn = (label: string) =>
  catalogWrite({ collection: 'cancellation_reasons', op: 'insert', data: { label, active: true }, label: 'Create cancellation reason' }).then((r) => r.id!)
export const updateReasonFn = (id: string, label: string) =>
  catalogWrite({ collection: 'cancellation_reasons', op: 'update', id, data: { label }, label: 'Update cancellation reason' })
export const setReasonActiveFn = (id: string, active: boolean) =>
  catalogWrite({ collection: 'cancellation_reasons', op: 'update', id, data: { active }, label: 'Toggle cancellation reason' })
export const deleteReasonFn = (id: string) =>
  catalogWrite({ collection: 'cancellation_reasons', op: 'delete', id, label: 'Delete cancellation reason' })

// Announcements
export const createAnnouncementFn = (d: { title: string; message: string; expiryDate: string }) =>
  catalogWrite({ collection: 'announcements', op: 'insert', data: { title: d.title, message: d.message, expiry_date: d.expiryDate, published: true }, label: 'Create announcement' }).then((r) => r.id!)
export const unpublishAnnouncementFn = (id: string) =>
  catalogWrite({ collection: 'announcements', op: 'update', id, data: { published: false }, label: 'Unpublish announcement' })
export const deleteAnnouncementFn = (id: string) =>
  catalogWrite({ collection: 'announcements', op: 'delete', id, label: 'Delete announcement' })

// Package definitions
export const createPackageDefFn = (d: { name: string; sessions: number; validityDays: number }) =>
  catalogWrite({ collection: 'package_definitions', op: 'insert', data: { name: d.name, sessions: d.sessions, validity_days: d.validityDays }, label: 'Create package definition' }).then((r) => r.id!)

// Therapist availability windows
export const publishAvailabilityFn = (d: { therapistId: string; clinicId: string; date: string; start: string; end: string }) =>
  catalogWrite({ collection: 'therapist_availability', op: 'insert', data: { therapist_id: d.therapistId, clinic_id: d.clinicId, date: d.date, start: d.start, end: d.end }, label: 'Publish availability' }).then((r) => r.id!)
export const removeAvailabilityFn = (id: string) =>
  catalogWrite({ collection: 'therapist_availability', op: 'delete', id, label: 'Remove availability' })

/** Admin advances a product purchase's follow-up status. */
export async function setFollowUpStatusFn(purchaseId: string, status: string): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('set_follow_up_status', { purchaseId, status })
  if (r.error || !r.ok) throw new Error(r.error || 'Could not update the follow-up status.')
}

// ---------------- FRIENDS & CREDIT TRANSFER ----------------

/** Send a friend request by the friend's email. Returns the new link + the friend's id/name. */
export async function friendRequestFn(email: string): Promise<{ id: string; addresseeUserId: string; addresseeName: string }> {
  const r = await invokeFn<{ id?: string; addresseeUserId?: string; addresseeName?: string; error?: string }>('friend_request', { email })
  if (r.error || !r.id) throw new Error(r.error || 'Could not send the friend request.')
  return { id: r.id, addresseeUserId: r.addresseeUserId!, addresseeName: r.addresseeName! }
}

/** Accept / decline an incoming request, or remove a friend. */
export async function friendRespondFn(friendId: string, action: 'accept' | 'decline' | 'remove'): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('friend_respond', { friendId, action })
  if (r.error || !r.ok) throw new Error(r.error || 'Could not update the friend request.')
}

/** Transfer package sessions to a confirmed friend. Returns the caller's new remaining. */
export async function transferCreditFn(input: { fromPackageId: string; toUserId: string; sessions: number }): Promise<{ fromRemaining: number; recipientPackageId: string }> {
  const r = await invokeFn<{ ok?: boolean; fromRemaining?: number; recipientPackageId?: string; error?: string }>('transfer_credit', input)
  if (r.error || !r.ok) throw new Error(r.error || 'Could not transfer the credit.')
  return { fromRemaining: r.fromRemaining!, recipientPackageId: r.recipientPackageId! }
}

// ---------------- ROLES & PERMISSIONS ----------------

/** Master admin appoints a registered patient as a sub-admin. */
export async function appointSubAdminFn(userId: string): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('set_user_role', { targetUserId: userId, role: 'admin', adminLevel: 'sub' })
  if (r.error || !r.ok) throw new Error(r.error || 'Could not appoint the sub-admin.')
}

/** Master admin revokes a sub-admin's access (back to patient). */
export async function removeSubAdminFn(userId: string): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('set_user_role', { targetUserId: userId, role: 'patient', adminLevel: null })
  if (r.error || !r.ok) throw new Error(r.error || 'Could not remove the sub-admin.')
}

/** Master admin toggles a single sub-admin capability (camelCase key → snake_case column). */
export async function setPermissionFn(capability: string, value: boolean): Promise<void> {
  const column = capability.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
  const r = await invokeFn<{ ok?: boolean; error?: string }>('set_permission', { column, value })
  if (r.error || !r.ok) throw new Error(r.error || 'Could not update the permission.')
}

/** Appoint a registered user as a physiotherapist (inserts a linked therapist row). Returns its id. */
export const appointPhysiotherapistFn = (userId: string, name: string) =>
  catalogWrite({ collection: 'therapists', op: 'insert', data: { name, active: true, user_id: userId }, label: 'Appoint physiotherapist' }).then((r) => r.id!)

/** Remove the physiotherapist role: deactivate the therapist and unlink its login. */
export const removePhysiotherapistFn = (therapistId: string) =>
  catalogWrite({ collection: 'therapists', op: 'update', id: therapistId, data: { active: false, user_id: null }, label: 'Remove physiotherapist' })

/** Master admin deactivates/reactivates a user (cross-user write on app_users). */
export async function setUserActiveFn(input: {
  targetUserId: string; active: boolean; actorUserId?: string; actorName?: string
}): Promise<void> {
  const r = await invokeFn<{ ok?: boolean; error?: string }>('set_user_active', input)
  if (r.error || !r.ok) throw new Error(r.error || 'Could not update the user.')
}

/** Add a child under the signed-in patient (owner-scoped). Returns the new row id. */
export async function addChildMember(userId: string, name: string): Promise<string> {
  const row = await coll(COLLECTIONS.family).insert({
    name: name.trim(), relationship: 'child', is_child: true, status: 'active',
    family_group_id: userId, parent_user_id: userId,
  })
  return (row as any).id
}
