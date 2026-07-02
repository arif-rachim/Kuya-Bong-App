/**
 * Load the logged-in user's world from manggaleh into the Zustand store, so all
 * existing screens render real backend data. Used after login and on app boot
 * (session restore). Only active when VITE_USE_MANGGALEH is on.
 */
import { useApp } from '../../store/appStore'
import { mgGetSession, mgSignOut } from './auth'
import * as repo from './repo'
import type { PatientProfile, User } from '../../data/types'

export async function hydrateFromManggaleh(): Promise<boolean> {
  const session = await mgGetSession()
  if (!session) return false

  const [
    appUser, profile, familyOv,
    clinics, services, therapists, availability, reasons, packageDefs, products, announcements, perms,
    appts, packages, friendsOv, transfers, purchases,
  ] = await Promise.all([
    repo.getMyAppUser(), repo.getMyProfile(), repo.familyOverview(),
    repo.listClinics(), repo.listServices(), repo.listTherapists(), repo.listAvailability(),
    repo.listCancellationReasons(), repo.listPackageDefs(), repo.listProducts(), repo.listAnnouncements(),
    repo.getSubAdminPermissions(),
    repo.listMyAppointments(), repo.listMyPackages(), repo.friendsOverview(), repo.listMyTransfers(), repo.listMyPurchases(),
  ])

  // BR (v0.7 §29): a deactivated user must not be able to sign in. RLS won't stop
  // auth, so enforce it here — drop the session and abort hydration.
  if (appUser && appUser.active === false) {
    await mgSignOut().catch(() => {})
    return false
  }

  const me: User = {
    id: session.id,
    role: appUser?.role ?? 'patient',
    adminLevel: appUser?.adminLevel,
    name: appUser?.name ?? session.name,
    mobile: '',
    email: session.email,
    password: '',
    verification: 'verified',
    active: appUser?.active ?? true,
  }

  // The patient can't read other users, so the Friends/Family screens need stub
  // user records (id + name) for linked friends and the adults who invited them.
  // Family's inviterName() also resolves via a profile keyed by family group id
  // (which equals the inviter's user id for manggaleh-registered patients).
  const stubUser = (id: string, name: string): User => ({ id, role: 'patient', name, mobile: '', email: '', password: '', verification: 'verified', active: true })
  const stubs = new Map<string, User>()
  for (const f of friendsOv.friendUsers) stubs.set(f.id, stubUser(f.id, f.name))
  for (const inv of familyOv.inviters) stubs.set(inv.familyGroupId, stubUser(inv.familyGroupId, inv.name))
  const inviterProfiles: PatientProfile[] = familyOv.inviters.map((inv) => ({ id: `prof_${inv.familyGroupId}`, userId: inv.familyGroupId, familyGroupId: inv.familyGroupId }))

  useApp.setState({
    users: [me, ...stubs.values()],
    currentUserId: session.id,
    profiles: [...(profile ? [profile] : []), ...inviterProfiles],
    family: familyOv.family,
    clinics, services, therapists, availability,
    cancellationReasons: reasons,
    packageDefs, products, announcements,
    subAdminPermissions: perms ?? useApp.getState().subAdminPermissions,
    appointments: appts,
    patientPackages: packages,
    friends: friendsOv.friends,
    creditTransfers: transfers,
    purchases,
  })

  // Physiotherapists (a patient-role user linked to a therapist record) additionally
  // load appointments ASSIGNED to them — owner-scoped reads only return their own
  // rows, so this comes from a service-key Function. Merge + add patient stubs so
  // the schedule can render names.
  const isPhysio = therapists.some((t) => t.userId === session.id && t.active)
  if (me.role !== 'admin' && isPhysio) {
    try {
      const ps = await repo.physioAppointments()
      useApp.setState((s) => {
        const seen = new Set(s.appointments.map((a) => a.id))
        const known = new Set(s.users.map((u) => u.id))
        return {
          appointments: [...s.appointments, ...ps.appointments.filter((a) => !seen.has(a.id))],
          users: [...s.users, ...ps.patients.filter((p) => !known.has(p.id)).map((p) => stubUser(p.id, p.name))],
        }
      })
    } catch { /* keep own data if the physio function is unavailable */ }
  }

  // Admins (and sub-admins) additionally load ALL cross-user data via a
  // service-key Function (own-scoped reads only return their own rows).
  if (me.role === 'admin') {
    try {
      const a = await repo.adminBootstrap()
      // make sure the logged-in admin is present in the user list
      const users = a.users.some((u) => u.id === me.id) ? a.users : [me, ...a.users]
      useApp.setState({
        users,
        appointments: a.appointments,
        patientPackages: a.patientPackages,
        packageUsage: a.packageUsage,
        purchases: a.purchases,
        creditTransfers: a.creditTransfers,
        auditLog: a.auditLog,
      })
    } catch { /* keep own-scoped data if the admin function is unavailable */ }
  }
  return true
}
