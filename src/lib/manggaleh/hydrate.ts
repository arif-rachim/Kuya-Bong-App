/**
 * Load the logged-in user's world from manggaleh into the Zustand store, so all
 * existing screens render real backend data. Used after login and on app boot
 * (session restore). Only active when VITE_USE_MANGGALEH is on.
 */
import { useApp } from '../../store/appStore'
import { mgGetSession } from './auth'
import * as repo from './repo'
import type { User } from '../../data/types'

export async function hydrateFromManggaleh(): Promise<boolean> {
  const session = await mgGetSession()
  if (!session) return false

  const [
    appUser, profile, family,
    clinics, services, therapists, availability, reasons, packageDefs, products, announcements, perms,
    appts, packages, friendsOv, transfers, purchases,
  ] = await Promise.all([
    repo.getMyAppUser(), repo.getMyProfile(), repo.listMyFamily(),
    repo.listClinics(), repo.listServices(), repo.listTherapists(), repo.listAvailability(),
    repo.listCancellationReasons(), repo.listPackageDefs(), repo.listProducts(), repo.listAnnouncements(),
    repo.getSubAdminPermissions(),
    repo.listMyAppointments(), repo.listMyPackages(), repo.friendsOverview(), repo.listMyTransfers(), repo.listMyPurchases(),
  ])

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

  // The patient can't read other users, so the Friends screen needs stub user
  // records (id + name) for the people they're linked to.
  const friendStubs: User[] = friendsOv.friendUsers.map((f) => ({
    id: f.id, role: 'patient', name: f.name, mobile: '', email: '', password: '', verification: 'verified', active: true,
  }))

  useApp.setState({
    users: [me, ...friendStubs],
    currentUserId: session.id,
    profiles: profile ? [profile] : [],
    family,
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
