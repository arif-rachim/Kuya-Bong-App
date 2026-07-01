/** Derived selector hooks on top of useApp. */
import { useMemo } from 'react'
import { useApp } from './appStore'
import { todayISO } from '../lib/date'
import type { Appointment, Capability, FamilyMember, PatientPackage, Therapist, User } from '../data/types'

/** Where to send a user after login, based on role and physiotherapist linkage. */
export function homePathFor(user: User | null | undefined, therapists: Therapist[]): string {
  if (!user) return '/welcome'
  if (user.role === 'admin') return '/admin/dashboard'
  if (therapists.some((t) => t.userId === user.id && t.active)) return '/physio/schedule'
  return '/patient/home'
}

/** True when the logged-in user is an active Physiotherapist (v0.7). */
export function useIsPhysiotherapist() {
  return useApp((s) => s.therapists.some((t) => t.userId === s.currentUserId && t.active))
}

/** Therapist record ids linked to the logged-in physiotherapist user. */
export function usePhysioTherapistIds() {
  // Derive with useMemo: a selector that returns a fresh array on every call
  // makes useSyncExternalStore loop (React #185). Select stable slices instead.
  const therapists = useApp((s) => s.therapists)
  const currentUserId = useApp((s) => s.currentUserId)
  return useMemo(
    () => therapists.filter((t) => t.userId === currentUserId).map((t) => t.id),
    [therapists, currentUserId],
  )
}

export function useCurrentUser() {
  return useApp((s) => s.users.find((u) => u.id === s.currentUserId) ?? null)
}

export function useCurrentProfile() {
  return useApp((s) => s.profiles.find((p) => p.userId === s.currentUserId) ?? null)
}

/** True when the logged-in user is the Master Admin (Kuya). */
export function useIsMaster() {
  return useApp((s) => {
    const u = s.users.find((u) => u.id === s.currentUserId)
    return u?.role === 'admin' && u.adminLevel === 'master'
  })
}

/**
 * Whether the current admin can use a capability (blueprint v0.6 §6).
 * Master Admin has everything; sub-admins follow the central permission profile.
 */
export function useCan(capability: Capability) {
  return useApp((s) => {
    const u = s.users.find((u) => u.id === s.currentUserId)
    if (u?.role !== 'admin') return false
    if (u.adminLevel === 'master') return true
    return s.subAdminPermissions[capability] === true
  })
}

/** True when the current admin has at least one of the given capabilities. */
export function useCanAny(capabilities: Capability[]) {
  return useApp((s) => {
    const u = s.users.find((u) => u.id === s.currentUserId)
    if (u?.role !== 'admin') return false
    if (u.adminLevel === 'master') return true
    return capabilities.some((c) => s.subAdminPermissions[c] === true)
  })
}

export function useClinic(clinicId: string | undefined) {
  return useApp((s) => s.clinics.find((c) => c.id === clinicId) ?? null)
}

export function useClinicName(clinicId: string | undefined) {
  return useApp((s) => s.clinics.find((c) => c.id === clinicId)?.name ?? '—')
}

/** User's active & valid package (balance > 0, not yet expired). */
export function activePackageOf(packages: PatientPackage[], userId: string): PatientPackage | null {
  return (
    packages.find(
      (p) => p.ownerUserId === userId && p.remaining > 0 && p.expiryDate >= todayISO(),
    ) ?? null
  )
}

export function useActivePackage(userId: string | null | undefined) {
  return useApp((s) => (userId ? activePackageOf(s.patientPackages, userId) : null))
}

/** Upcoming appointment (Confirmed/Rescheduled, not yet past). */
export function isUpcoming(a: Appointment): boolean {
  return (a.status === 'Confirmed' || a.status === 'Rescheduled' || a.status === 'PendingApproval') && a.date >= todayISO()
}

export function useFamilyMembers(familyGroupId: string | undefined): FamilyMember[] {
  // Memoize: returning a fresh filtered array straight from the hook can loop
  // consumers that treat the result as a render input (React #185).
  const family = useApp((s) => s.family)
  return useMemo(
    () => (familyGroupId ? family.filter((m) => m.familyGroupId === familyGroupId) : []),
    [family, familyGroupId],
  )
}
