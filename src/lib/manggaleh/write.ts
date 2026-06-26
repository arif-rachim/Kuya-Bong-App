/**
 * Owner-scoped writes via the SDK (publishable key + the signed-in user). These
 * are the mutations a patient can perform on their own data; cross-user/admin
 * writes (assign package, transfer credit, manage catalog) need Functions.
 */
import { coll, COLLECTIONS } from './collections'
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

/** Update the signed-in patient's own profile. */
export async function updateMyProfile(profileId: string, patch: { dateOfBirth?: string; gender?: string; address?: string; emergencyContact?: string }) {
  await coll(COLLECTIONS.profiles).update(profileId, {
    date_of_birth: patch.dateOfBirth, gender: patch.gender, address: patch.address, emergency_contact: patch.emergencyContact,
  })
}
