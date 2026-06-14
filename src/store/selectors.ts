/** Hook turunan (derived selectors) di atas useApp. */
import { useApp } from './appStore'
import { todayISO } from '../lib/date'
import type { Appointment, FamilyMember, PatientPackage } from '../data/types'

export function useCurrentUser() {
  return useApp((s) => s.users.find((u) => u.id === s.currentUserId) ?? null)
}

export function useCurrentProfile() {
  return useApp((s) => s.profiles.find((p) => p.userId === s.currentUserId) ?? null)
}

export function useClinic(clinicId: string | undefined) {
  return useApp((s) => s.clinics.find((c) => c.id === clinicId) ?? null)
}

export function useClinicName(clinicId: string | undefined) {
  return useApp((s) => s.clinics.find((c) => c.id === clinicId)?.name ?? '—')
}

/** Paket aktif & valid milik user (saldo > 0, belum expired). */
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

/** Appointment yang akan datang (Confirmed/Rescheduled, belum lewat). */
export function isUpcoming(a: Appointment): boolean {
  return (a.status === 'Confirmed' || a.status === 'Rescheduled' || a.status === 'PendingApproval') && a.date >= todayISO()
}

export function useFamilyMembers(familyGroupId: string | undefined): FamilyMember[] {
  const family = useApp((s) => s.family)
  return familyGroupId ? family.filter((m) => m.familyGroupId === familyGroupId) : []
}
