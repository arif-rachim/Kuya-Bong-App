/**
 * Single Realief Expert store (mock, client-only).
 *
 * All data mutations go through actions here — this is the "seam" for future backend
 * integration (replace action bodies with SDK calls + optimistic updates). Components
 * must NOT mutate state directly.
 *
 * Actions with validation return a `string` (error message) or `null` (success).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/uid'
import { addDays, hoursUntil, todayISO } from '../lib/date'
import { addMinutes, findConflict, timeToMin } from '../lib/booking'
import {
  FAMILY_GROUP,
  generateAvailability,
  seedAnnouncements,
  seedAppointments,
  seedCancellationReasons,
  seedClinics,
  seedFamily,
  seedPackageDefs,
  seedPatientPackages,
  seedProducts,
  seedProfiles,
  seedPurchases,
  seedServices,
  seedSubAdminPermissions,
  seedTherapists,
  seedUsers,
} from '../data/seed'
import type {
  Announcement,
  Appointment,
  AuditEntry,
  BookingSource,
  Capability,
  CancellationReason,
  Clinic,
  CreditTransfer,
  FamilyMember,
  Friend,
  PackageDefinition,
  PackageUsage,
  PatientPackage,
  PatientProfile,
  Product,
  ProductCategory,
  ProductPurchase,
  ServiceType,
  SubAdminPermissions,
  Therapist,
  TherapistAvailability,
  User,
} from '../data/types'

/** Minimum hours before a session to allow cancel/reschedule (Q-08 default). */
export const CANCEL_CUTOFF_HOURS = 24
/** Mock verification code. */
export const MOCK_OTP = '123456'

type Result = string | null

interface RegisterInput {
  name: string
  email: string
  mobile: string
  password: string
}

interface AppState {
  // ---- data ----
  users: User[]
  profiles: PatientProfile[]
  family: FamilyMember[]
  clinics: Clinic[]
  services: ServiceType[]
  therapists: Therapist[]
  cancellationReasons: CancellationReason[]
  availability: TherapistAvailability[]
  appointments: Appointment[]
  packageDefs: PackageDefinition[]
  patientPackages: PatientPackage[]
  packageUsage: PackageUsage[]
  products: Product[]
  purchases: ProductPurchase[]
  announcements: Announcement[]
  subAdminPermissions: SubAdminPermissions
  auditLog: AuditEntry[]
  friends: Friend[]
  creditTransfers: CreditTransfer[]

  // ---- session ----
  currentUserId: string | null

  // ---- settings ----
  requireApproval: boolean
  setRequireApproval: (value: boolean) => void

  // ---- auth ----
  login: (email: string, password: string) => Result
  loginAs: (role: 'patient' | 'admin') => void
  register: (input: RegisterInput) => { error?: string; userId?: string }
  verify: (userId: string, code: string) => Result
  resendCode: (userId: string) => void
  logout: () => void
  updateProfile: (patch: Partial<User> & Partial<PatientProfile>) => Result
  changePassword: (current: string, next: string) => Result
  resetPassword: (email: string, code: string, next: string) => Result

  // ---- admin roles (v0.4: master / sub-admin) ----
  appointSubAdmin: (userId: string) => Result
  removeSubAdmin: (userId: string) => Result
  setSubAdminPermission: (capability: Capability, value: boolean) => void
  // ---- user deactivation (v0.7 §8.1) ----
  deactivateUser: (userId: string) => Result
  reactivateUser: (userId: string) => Result

  // ---- clinics (v0.4 lifecycle) ----
  updateClinicName: (id: string, name: string) => Result
  createClinic: (input: { name: string; address: string }) => Result
  updateClinic: (id: string, patch: { name?: string; address?: string }) => Result
  toggleClinicActive: (id: string) => void
  deleteClinic: (id: string) => Result

  // ---- service types (Section 25.1) ----
  createService: (input: { name: string; durationMinutes: number; notes?: string }) => Result
  updateService: (id: string, patch: Partial<Pick<ServiceType, 'name' | 'durationMinutes' | 'notes'>>) => Result
  toggleServiceActive: (id: string) => void

  // ---- therapists / physiotherapists (Section 25.3, v0.7 §7.3) ----
  createTherapist: (name: string) => Result
  updateTherapist: (id: string, name: string) => Result
  toggleTherapistActive: (id: string) => void
  appointPhysiotherapist: (userId: string) => Result
  removePhysiotherapist: (therapistId: string) => Result

  // ---- cancellation reasons (Section 25.5) ----
  createCancellationReason: (label: string) => Result
  updateCancellationReason: (id: string, label: string) => Result
  toggleCancellationReasonActive: (id: string) => void

  // ---- availability (therapist working windows) ----
  publishAvailability: (input: { therapistId: string; clinicId: string; date: string; start: string; end: string }) => Result
  removeAvailability: (id: string) => Result

  // ---- appointments ----
  bookAppointment: (input: {
    serviceTypeId: string
    therapistId: string
    clinicId: string
    date: string
    start: string
    forMemberId?: string
    forMemberName: string
    source?: BookingSource
    patientUserId?: string
    note?: string
  }) => Result
  rescheduleAppointment: (
    appointmentId: string,
    target: { therapistId: string; clinicId: string; date: string; start: string },
    by: 'patient' | 'admin' | 'physiotherapist',
  ) => Result
  cancelAppointment: (
    appointmentId: string,
    by: 'patient' | 'admin' | 'physiotherapist',
    reasonId?: string,
    note?: string,
  ) => Result
  markCompleted: (appointmentId: string, patientPackageId?: string) => Result
  markNoShow: (appointmentId: string) => Result
  approveAppointment: (appointmentId: string) => void
  rejectAppointment: (appointmentId: string) => void

  // ---- packages ----
  createPackageDef: (name: string, sessions: number, validityDays: number) => Result
  assignPackage: (userId: string, definitionId: string, initialRemaining?: number) => Result
  updatePatientPackageRemaining: (packageId: string, remaining: number) => Result
  removePatientPackage: (packageId: string) => Result

  // ---- family ----
  addChild: (parentUserId: string, name: string) => Result
  linkAdult: (parentUserId: string, emailOrMobile: string) => Result
  acceptLink: (familyMemberId: string) => void
  declineLink: (familyMemberId: string) => void
  removeFamilyMember: (familyMemberId: string) => void

  // ---- products ----
  createProduct: (input: { name: string; category: ProductCategory; price: number; notes?: string; images?: string[] }) => Result
  updateProduct: (id: string, patch: Partial<Pick<Product, 'name' | 'price' | 'category' | 'notes' | 'images'>>) => Result
  toggleProductActive: (id: string) => void
  recordPurchase: (input: {
    patientUserId: string
    productId: string
    quantity: number
    followUpDays?: number
    notes?: string
  }) => Result
  setFollowUpStatus: (purchaseId: string, status: ProductPurchase['followUpStatus']) => void

  // ---- announcements (v0.4) ----
  createAnnouncement: (input: { title: string; message: string; expiryDate: string }) => Result
  unpublishAnnouncement: (id: string) => void
  deleteAnnouncement: (id: string) => void

  // ---- audit (v0.6) ----
  logAudit: (action: string, detail: string) => void

  // ---- friends & credit transfer (v0.6 §5) ----
  requestFriend: (emailOrMobile: string) => Result
  acceptFriend: (friendId: string) => void
  declineFriend: (friendId: string) => void
  removeFriend: (friendId: string) => void
  transferCredit: (input: { fromPackageId: string; toUserId: string; sessions: number }) => Result
}

/** Refresh package status based on balance & expiry (BR-13/zero balance). */
function recomputePackage(p: PatientPackage): PatientPackage {
  let status: PatientPackage['status'] = 'active'
  if (p.remaining <= 0) status = 'used'
  else if (p.expiryDate < todayISO()) status = 'expired'
  return { ...p, status }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      profiles: seedProfiles,
      family: seedFamily,
      clinics: seedClinics,
      services: seedServices,
      therapists: seedTherapists,
      cancellationReasons: seedCancellationReasons,
      availability: generateAvailability(),
      appointments: seedAppointments(),
      packageDefs: seedPackageDefs,
      patientPackages: seedPatientPackages(),
      packageUsage: [],
      products: seedProducts,
      purchases: seedPurchases(),
      announcements: seedAnnouncements(),
      subAdminPermissions: seedSubAdminPermissions,
      auditLog: [],
      friends: [],
      creditTransfers: [],
      currentUserId: null,
      requireApproval: false, // Q-07 default: auto-confirm. Admin can switch on manual approval.

      setRequireApproval: (value) => set({ requireApproval: value }),

      // ---------------- AUTH ----------------
      login: (email, password) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (!user || user.password !== password) return 'Incorrect email or password.'
        if (user.active === false) return 'This account has been deactivated. Please contact the clinic.'
        set({ currentUserId: user.id })
        return null
      },

      loginAs: (role) => {
        const user = get().users.find((u) => u.role === role && u.verification === 'verified' && u.active !== false)
        if (user) set({ currentUserId: user.id })
      },

      register: ({ name, email, mobile, password }) => {
        const exists = get().users.find(
          (u) =>
            u.email.toLowerCase() === email.trim().toLowerCase() ||
            u.mobile.replace(/\s/g, '') === mobile.replace(/\s/g, ''),
        )
        if (exists) return { error: 'Email or mobile number is already registered.' }
        const userId = uid('u')
        const groupId = uid('fam')
        const user: User = {
          id: userId,
          role: 'patient',
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password,
          verification: 'unverified',
        }
        const profile: PatientProfile = { id: uid('p'), userId, familyGroupId: groupId }
        set((s) => ({ users: [...s.users, user], profiles: [...s.profiles, profile] }))
        return { userId }
      },

      verify: (userId, code) => {
        if (code.trim() !== MOCK_OTP) return 'Verification code is incorrect or expired.'
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, verification: 'verified' } : u)),
          currentUserId: userId,
        }))
        return null
      },

      resendCode: () => {
        /* mock: code stays MOCK_OTP */
      },

      logout: () => set({ currentUserId: null }),

      updateProfile: (patch) => {
        const id = get().currentUserId
        if (!id) return 'No active session.'
        if (patch.name !== undefined && !patch.name.trim()) return 'Name can\'t be empty.'
        if (patch.email !== undefined && !patch.email.trim()) return 'Email can\'t be empty.'
        if (patch.mobile !== undefined && !patch.mobile.trim()) return 'Mobile number can\'t be empty.'
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  name: patch.name?.trim() ?? u.name,
                  email: patch.email?.trim() ?? u.email,
                  mobile: patch.mobile?.trim() ?? u.mobile,
                }
              : u,
          ),
          profiles: s.profiles.map((p) =>
            p.userId === id
              ? {
                  ...p,
                  dateOfBirth: patch.dateOfBirth ?? p.dateOfBirth,
                  gender: patch.gender ?? p.gender,
                  address: patch.address ?? p.address,
                  emergencyContact: patch.emergencyContact ?? p.emergencyContact,
                }
              : p,
          ),
        }))
        return null
      },

      changePassword: (current, next) => {
        const id = get().currentUserId
        const user = get().users.find((u) => u.id === id)
        if (!user) return 'No active session.'
        if (user.password !== current) return 'Current password is incorrect.'
        if (next.length < 6) return 'New password must be at least 6 characters.'
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, password: next } : u)) }))
        return null
      },

      resetPassword: (email, code, next) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (!user) return 'Email is not registered.'
        if (code.trim() !== MOCK_OTP) return 'Identity verification failed (incorrect code).'
        if (next.length < 6) return 'New password must be at least 6 characters.'
        set((s) => ({ users: s.users.map((u) => (u.id === user.id ? { ...u, password: next } : u)) }))
        return null
      },

      // ---------------- ADMIN ROLES (v0.4) ----------------
      // Only the Master Admin may appoint/remove sub-admins (enforced in the UI too).
      appointSubAdmin: (userId) => {
        const target = get().users.find((u) => u.id === userId)
        if (!target) return 'User not found.'
        if (target.role === 'admin') return 'This user is already an admin.'
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, role: 'admin', adminLevel: 'sub' } : u)),
        }))
        get().logAudit('Appoint sub-admin', `${target.name} (${target.email})`)
        return null
      },

      removeSubAdmin: (userId) => {
        const target = get().users.find((u) => u.id === userId)
        if (!target) return 'User not found.'
        if (target.adminLevel === 'master') return 'The Master Admin can\'t be removed.'
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, role: 'patient', adminLevel: undefined } : u)),
        }))
        get().logAudit('Remove sub-admin', `${target.name} (${target.email})`)
        return null
      },

      setSubAdminPermission: (capability, value) => {
        set((s) => ({ subAdminPermissions: { ...s.subAdminPermissions, [capability]: value } }))
        get().logAudit('Change sub-admin permission', `${capability} = ${value ? 'on' : 'off'}`)
      },

      // Deactivate a user without deleting history (v0.7 BR-03). Any Sub-Admin/
      // Physiotherapist privileges become inactive because they can no longer log in.
      deactivateUser: (userId) => {
        const target = get().users.find((u) => u.id === userId)
        if (!target) return 'User not found.'
        if (target.adminLevel === 'master') return 'The Master Admin can\'t be deactivated.'
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, active: false } : u)) }))
        get().logAudit('Deactivate user', `${target.name} (${target.email})`)
        return null
      },

      reactivateUser: (userId) => {
        const target = get().users.find((u) => u.id === userId)
        if (!target) return 'User not found.'
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, active: true } : u)) }))
        get().logAudit('Reactivate user', `${target.name} (${target.email})`)
        return null
      },

      // ---------------- CLINICS ----------------
      updateClinicName: (id, name) => {
        if (!name.trim()) return 'Clinic name can\'t be empty.'
        set((s) => ({ clinics: s.clinics.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)) }))
        return null
      },

      createClinic: ({ name, address }) => {
        if (!name.trim()) return 'Clinic name can\'t be empty.'
        const clinic: Clinic = { id: uid('clinic'), name: name.trim(), address: address.trim(), active: true }
        set((s) => ({ clinics: [...s.clinics, clinic] }))
        get().logAudit('Create clinic', clinic.name)
        return null
      },

      updateClinic: (id, patch) => {
        if (patch.name !== undefined && !patch.name.trim()) return 'Clinic name can\'t be empty.'
        set((s) => ({
          clinics: s.clinics.map((c) =>
            c.id === id ? { ...c, name: patch.name?.trim() ?? c.name, address: patch.address?.trim() ?? c.address } : c,
          ),
        }))
        return null
      },

      toggleClinicActive: (id) =>
        set((s) => ({ clinics: s.clinics.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),

      // Delete only when nothing is linked to the clinic; otherwise deactivate (BR v0.4 §1).
      deleteClinic: (id) => {
        const state = get()
        const hasAppointments = state.appointments.some((a) => a.clinicId === id)
        const hasAvailability = state.availability.some((w) => w.clinicId === id)
        if (hasAppointments || hasAvailability)
          return 'This clinic has linked records — deactivate it instead of deleting.'
        const clinic = state.clinics.find((c) => c.id === id)
        set((s) => ({ clinics: s.clinics.filter((c) => c.id !== id) }))
        get().logAudit('Delete clinic', clinic?.name ?? id)
        return null
      },

      // ---------------- SERVICE TYPES (BR-20/21) ----------------
      createService: ({ name, durationMinutes, notes }) => {
        if (!name.trim()) return 'Service name can\'t be empty.'
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return 'Duration must be greater than 0 minutes.'
        const service: ServiceType = { id: uid('svc'), name: name.trim(), durationMinutes, active: true, notes }
        set((s) => ({ services: [...s.services, service] }))
        return null
      },

      updateService: (id, patch) => {
        if (patch.name !== undefined && !patch.name.trim()) return 'Service name can\'t be empty.'
        if (patch.durationMinutes !== undefined && (!Number.isFinite(patch.durationMinutes) || patch.durationMinutes <= 0))
          return 'Duration must be greater than 0 minutes.'
        set((s) => ({
          services: s.services.map((sv) =>
            sv.id === id
              ? {
                  ...sv,
                  name: patch.name?.trim() ?? sv.name,
                  durationMinutes: patch.durationMinutes ?? sv.durationMinutes,
                  notes: patch.notes ?? sv.notes,
                }
              : sv,
          ),
        }))
        return null
      },

      toggleServiceActive: (id) =>
        set((s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, active: !sv.active } : sv)) })),

      // ---------------- THERAPISTS ----------------
      createTherapist: (name) => {
        if (!name.trim()) return 'Therapist name can\'t be empty.'
        const therapist: Therapist = { id: uid('th'), name: name.trim(), active: true }
        set((s) => ({ therapists: [...s.therapists, therapist] }))
        return null
      },

      updateTherapist: (id, name) => {
        if (!name.trim()) return 'Therapist name can\'t be empty.'
        set((s) => ({ therapists: s.therapists.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)) }))
        return null
      },

      toggleTherapistActive: (id) =>
        set((s) => ({ therapists: s.therapists.map((t) => (t.id === id ? { ...t, active: !t.active } : t)) })),

      // Appoint a registered user as a Physiotherapist (v0.7 BR-09): creates a
      // user-linked therapist so they can log in and manage their own schedule.
      appointPhysiotherapist: (userId) => {
        const state = get()
        const user = state.users.find((u) => u.id === userId)
        if (!user) return 'User not found.'
        if (state.therapists.some((t) => t.userId === userId && t.active))
          return 'This user is already a physiotherapist.'
        const therapist: Therapist = { id: uid('th'), name: user.name, active: true, userId }
        set((s) => ({ therapists: [...s.therapists, therapist] }))
        get().logAudit('Appoint physiotherapist', `${user.name} (${user.email})`)
        return null
      },

      // Remove the physiotherapist role: keep the record (for historical
      // appointments) but deactivate it and unlink the login.
      removePhysiotherapist: (therapistId) => {
        const t = get().therapists.find((x) => x.id === therapistId)
        if (!t) return 'Physiotherapist not found.'
        set((s) => ({
          therapists: s.therapists.map((x) => (x.id === therapistId ? { ...x, active: false, userId: undefined } : x)),
        }))
        get().logAudit('Remove physiotherapist', t.name)
        return null
      },

      // ---------------- CANCELLATION REASONS ----------------
      createCancellationReason: (label) => {
        if (!label.trim()) return 'Cancellation reason can\'t be empty.'
        const reason: CancellationReason = { id: uid('cr'), label: label.trim(), active: true }
        set((s) => ({ cancellationReasons: [...s.cancellationReasons, reason] }))
        return null
      },

      updateCancellationReason: (id, label) => {
        if (!label.trim()) return 'Cancellation reason can\'t be empty.'
        set((s) => ({
          cancellationReasons: s.cancellationReasons.map((r) => (r.id === id ? { ...r, label: label.trim() } : r)),
        }))
        return null
      },

      toggleCancellationReasonActive: (id) =>
        set((s) => ({
          cancellationReasons: s.cancellationReasons.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
        })),

      // ---------------- AVAILABILITY (therapist working windows) ----------------
      publishAvailability: ({ therapistId, clinicId, date, start, end }) => {
        if (date < todayISO()) return 'Can\'t add availability on a past date.'
        if (timeToMin(end) <= timeToMin(start)) return 'End time must be after the start time.'
        const therapist = get().therapists.find((t) => t.id === therapistId)
        if (!therapist) return 'Therapist not found.'
        const overlap = get().availability.find(
          (w) =>
            w.therapistId === therapistId &&
            w.clinicId === clinicId &&
            w.date === date &&
            timeToMin(start) < timeToMin(w.end) &&
            timeToMin(w.start) < timeToMin(end),
        )
        if (overlap) return 'This therapist already has an overlapping window at this clinic.'
        const window: TherapistAvailability = { id: uid('av'), therapistId, clinicId, date, start, end }
        set((s) => ({ availability: [...s.availability, window] }))
        return null
      },

      removeAvailability: (id) => {
        set((s) => ({ availability: s.availability.filter((w) => w.id !== id) }))
        return null
      },

      // ---------------- APPOINTMENTS ----------------
      bookAppointment: ({ serviceTypeId, therapistId, clinicId, date, start, forMemberId, forMemberName, source = 'App', patientUserId, note }) => {
        const state = get()
        const userId = patientUserId ?? state.currentUserId
        if (!userId) return 'No active session.'
        const user = state.users.find((u) => u.id === userId)
        if (!user) return 'Patient not found.'
        // BR-01: must be verified before booking (for bookings via App)
        if (source === 'App' && user.verification !== 'verified')
          return 'Your account must be verified before booking.'
        const service = state.services.find((sv) => sv.id === serviceTypeId)
        if (!service || !service.active) return 'Please choose an available service.'
        const therapist = state.therapists.find((t) => t.id === therapistId)
        if (!therapist || !therapist.active) return 'Please choose an available therapist.'
        if (hoursUntil(date, start) < 0) return 'That time has passed — please choose a valid time.'
        // BR-22: end time is derived from the service duration
        const end = addMinutes(start, service.durationMinutes)
        // must fall inside one of the therapist's working windows for the clinic/date
        const inWindow = state.availability.some(
          (w) =>
            w.therapistId === therapistId &&
            w.clinicId === clinicId &&
            w.date === date &&
            timeToMin(start) >= timeToMin(w.start) &&
            timeToMin(end) <= timeToMin(w.end),
        )
        if (!inWindow) return 'The therapist isn\'t available for the full duration at that time.'
        // BR-23/24: therapist & patient conflict checks
        const conflict = findConflict({
          appointments: state.appointments,
          therapistId,
          patientUserId: userId,
          date,
          start,
          end,
        })
        if (conflict) return conflict

        const apt: Appointment = {
          id: uid('apt'),
          clinicId,
          serviceTypeId,
          therapistId,
          date,
          start,
          end,
          patientUserId: userId,
          forMemberId,
          forMemberName,
          // App bookings need approval when the admin enabled it (Q-07);
          // admin/manual bookings are always confirmed immediately.
          status: source === 'App' && state.requireApproval ? 'PendingApproval' : 'Confirmed',
          source,
          note,
          createdAt: todayISO(),
        }
        set((s) => ({ appointments: [...s.appointments, apt] }))
        return null
      },

      rescheduleAppointment: (appointmentId, target, by) => {
        const state = get()
        const apt = state.appointments.find((a) => a.id === appointmentId)
        if (!apt) return 'Appointment not found.'
        // BR-05: cutoff (patients only)
        if (by === 'patient' && hoursUntil(apt.date, apt.start) < CANCEL_CUTOFF_HOURS)
          return `Rescheduling must be more than ${CANCEL_CUTOFF_HOURS} hours before the session.`
        const service = state.services.find((sv) => sv.id === apt.serviceTypeId)
        if (!service) return 'Service not found.'
        if (hoursUntil(target.date, target.start) < 0) return 'Target time has passed.'
        const end = addMinutes(target.start, service.durationMinutes)
        const inWindow = state.availability.some(
          (w) =>
            w.therapistId === target.therapistId &&
            w.clinicId === target.clinicId &&
            w.date === target.date &&
            timeToMin(target.start) >= timeToMin(w.start) &&
            timeToMin(end) <= timeToMin(w.end),
        )
        if (!inWindow) return 'The therapist isn\'t available for the full duration at that time.'
        // BR-23/24: re-check conflicts, ignoring this appointment itself
        const conflict = findConflict({
          appointments: state.appointments,
          therapistId: target.therapistId,
          patientUserId: apt.patientUserId,
          date: target.date,
          start: target.start,
          end,
          excludeAppointmentId: apt.id,
        })
        if (conflict) return conflict
        // note: no package deduction — balance unchanged (BR-14)
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  status: 'Rescheduled',
                  clinicId: target.clinicId,
                  therapistId: target.therapistId,
                  date: target.date,
                  start: target.start,
                  end,
                }
              : a,
          ),
        }))
        return null
      },

      cancelAppointment: (appointmentId, by, reasonId, note) => {
        const state = get()
        const apt = state.appointments.find((a) => a.id === appointmentId)
        if (!apt) return 'Appointment not found.'
        if (by === 'patient' && hoursUntil(apt.date, apt.start) < CANCEL_CUTOFF_HOURS)
          return `Cancellation must be more than ${CANCEL_CUTOFF_HOURS} hours before the session.`
        // no package deduction on cancel (BR-14)
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  status:
                    by === 'admin'
                      ? 'CancelledByAdmin'
                      : by === 'physiotherapist'
                        ? 'CancelledByPhysiotherapist'
                        : 'CancelledByPatient',
                  cancelledBy: by,
                  cancellationReasonId: reasonId,
                  cancellationNote: note,
                }
              : a,
          ),
        }))
        get().logAudit('Cancel appointment', `${apt.forMemberName} · ${apt.date} ${apt.start} (by ${by})`)
        return null
      },

      markCompleted: (appointmentId, patientPackageId) => {
        const state = get()
        const apt = state.appointments.find((a) => a.id === appointmentId)
        if (!apt) return 'Appointment not found.'
        const admin = state.users.find((u) => u.id === state.currentUserId)

        // if a package is selected, validate & deduct (BR-13/14)
        if (patientPackageId) {
          const pkg = state.patientPackages.find((p) => p.id === patientPackageId)
          if (!pkg) return 'Package not found.'
          if (pkg.expiryDate < todayISO()) return 'Package has expired — it can\'t be used.'
          if (pkg.remaining <= 0) return 'No sessions left in this package.'
          const usage: PackageUsage = {
            id: uid('use'),
            patientPackageId: pkg.id,
            appointmentId: apt.id,
            memberName: apt.forMemberName,
            date: todayISO(),
            recordedBy: admin?.name ?? 'Admin',
          }
          set((s) => ({
            patientPackages: s.patientPackages.map((p) =>
              p.id === pkg.id ? recomputePackage({ ...p, remaining: p.remaining - 1 }) : p,
            ),
            packageUsage: [...s.packageUsage, usage],
          }))
        }

        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'Completed' } : a,
          ),
        }))
        return null
      },

      markNoShow: (appointmentId) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'NoShow' } : a,
          ),
        }))
        return null
      },

      approveAppointment: (appointmentId) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'Confirmed' } : a,
          ),
        })),

      rejectAppointment: (appointmentId) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'CancelledByAdmin', cancelledBy: 'admin' } : a,
          ),
        })),

      // ---------------- PACKAGES ----------------
      createPackageDef: (name, sessions, validityDays) => {
        if (!name.trim()) return 'Package name can\'t be empty.'
        if (sessions <= 0) return 'Number of sessions must be greater than 0.'
        if (validityDays <= 0) return 'Validity must be greater than 0 days.'
        const def: PackageDefinition = { id: uid('pkg'), name: name.trim(), sessions, validityDays }
        set((s) => ({ packageDefs: [...s.packageDefs, def] }))
        return null
      },

      assignPackage: (userId, definitionId, initialRemaining) => {
        const def = get().packageDefs.find((d) => d.id === definitionId)
        if (!def) return 'Package definition not found.'
        // v0.8: Remaining Sessions defaults to the package count but can be edited
        // to initialize an existing/offline subscription.
        const remaining = initialRemaining ?? def.sessions
        if (!Number.isFinite(remaining) || remaining < 0) return 'Remaining sessions can\'t be negative.'
        if (remaining > def.sessions) return `Remaining sessions can't exceed the package total (${def.sessions}).`
        const assignDate = todayISO()
        const pp: PatientPackage = recomputePackage({
          id: uid('pp'),
          definitionId: def.id,
          name: def.name,
          ownerUserId: userId,
          totalSessions: def.sessions,
          remaining,
          assignDate,
          expiryDate: addDays(assignDate, def.validityDays),
          status: 'active',
        })
        set((s) => ({ patientPackages: [...s.patientPackages, pp] }))
        const owner = get().users.find((u) => u.id === userId)
        get().logAudit('Assign package', `${def.name} -> ${owner?.name ?? userId} (remaining ${remaining}/${def.sessions})`)
        return null
      },

      // v0.8: correct an assigned subscription's remaining sessions (>= 0, <= total).
      updatePatientPackageRemaining: (packageId, remaining) => {
        const pkg = get().patientPackages.find((p) => p.id === packageId)
        if (!pkg) return 'Package not found.'
        if (!Number.isFinite(remaining) || remaining < 0) return 'Remaining sessions can\'t be negative.'
        if (remaining > pkg.totalSessions) return `Remaining sessions can't exceed the package total (${pkg.totalSessions}).`
        const old = pkg.remaining
        set((s) => ({
          patientPackages: s.patientPackages.map((p) =>
            p.id === packageId ? recomputePackage({ ...p, remaining }) : p,
          ),
        }))
        get().logAudit('Edit package remaining', `${pkg.name}: ${old} -> ${remaining}`)
        return null
      },

      // v0.8: pull back / delete a wrongly assigned subscription (and its usage rows).
      removePatientPackage: (packageId) => {
        const pkg = get().patientPackages.find((p) => p.id === packageId)
        if (!pkg) return 'Package not found.'
        const usageCount = get().packageUsage.filter((u) => u.patientPackageId === packageId).length
        set((s) => ({
          patientPackages: s.patientPackages.filter((p) => p.id !== packageId),
          packageUsage: s.packageUsage.filter((u) => u.patientPackageId !== packageId),
        }))
        get().logAudit('Delete assigned package', `${pkg.name} (removed ${usageCount} usage record(s))`)
        return null
      },

      // ---------------- FAMILY ----------------
      addChild: (parentUserId, name) => {
        if (!name.trim()) return 'Child\'s name can\'t be empty.'
        const profile = get().profiles.find((p) => p.userId === parentUserId)
        const groupId = profile?.familyGroupId ?? FAMILY_GROUP
        const member: FamilyMember = {
          id: uid('fm'),
          familyGroupId: groupId,
          name: name.trim(),
          relationship: 'child',
          isChild: true,
          parentUserId,
          status: 'active',
        }
        set((s) => ({ family: [...s.family, member] }))
        return null
      },

      linkAdult: (parentUserId, emailOrMobile) => {
        const q = emailOrMobile.trim().toLowerCase()
        const target = get().users.find(
          (u) => u.email.toLowerCase() === q || u.mobile.replace(/\s/g, '') === q.replace(/\s/g, ''),
        )
        if (!target) return 'That email/mobile isn\'t registered. Please check again.'
        if (target.id === parentUserId) return 'You can\'t link your own account.'
        const profile = get().profiles.find((p) => p.userId === parentUserId)
        const groupId = profile?.familyGroupId ?? FAMILY_GROUP
        const member: FamilyMember = {
          id: uid('fm'),
          familyGroupId: groupId,
          name: target.name,
          relationship: 'spouse',
          isChild: false,
          linkedUserId: target.id,
          status: 'pending', // needs approval (BR-17)
        }
        set((s) => ({ family: [...s.family, member] }))
        return null
      },

      acceptLink: (familyMemberId) =>
        set((s) => ({
          family: s.family.map((m) => (m.id === familyMemberId ? { ...m, status: 'active' } : m)),
        })),

      declineLink: (familyMemberId) =>
        set((s) => ({
          family: s.family.filter((m) => m.id !== familyMemberId),
        })),

      // Remove a child or unlink an adult. Past package usage history is kept.
      removeFamilyMember: (familyMemberId) =>
        set((s) => ({
          family: s.family.filter((m) => m.id !== familyMemberId),
        })),

      // ---------------- PRODUCTS ----------------
      createProduct: ({ name, category, price, notes, images }) => {
        if (!name.trim()) return 'Product name can\'t be empty.'
        if (price < 0) return 'Invalid price.'
        const productNew: Product = { id: uid('prod'), name: name.trim(), category, price, active: true, notes, images }
        set((s) => ({ products: [...s.products, productNew] }))
        return null
      },

      updateProduct: (id, patch) => {
        if (patch.name !== undefined && !patch.name.trim()) return 'Product name can\'t be empty.'
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: patch.name?.trim() ?? p.name,
                  price: patch.price ?? p.price,
                  category: patch.category ?? p.category,
                  notes: patch.notes ?? p.notes,
                  images: patch.images ?? p.images,
                }
              : p,
          ),
        }))
        return null
      },

      toggleProductActive: (id) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)) })),

      recordPurchase: ({ patientUserId, productId, quantity, followUpDays, notes }) => {
        const product = get().products.find((p) => p.id === productId)
        if (!product) return 'Product not found.'
        if (!product.active) return 'Inactive products can\'t be sold.'
        if (quantity <= 0) return 'Quantity must be greater than 0.'
        const purchase: ProductPurchase = {
          id: uid('pur'),
          patientUserId,
          productId,
          productName: product.name,
          unitPriceAtSale: product.price, // price snapshot (BR-19)
          quantity,
          purchaseDate: todayISO(),
          estimatedFollowUpDate: followUpDays ? addDays(todayISO(), followUpDays) : undefined,
          followUpStatus: 'NotDue',
          notes,
        }
        set((s) => ({ purchases: [...s.purchases, purchase] }))
        return null
      },

      setFollowUpStatus: (purchaseId, status) =>
        set((s) => ({
          purchases: s.purchases.map((p) => (p.id === purchaseId ? { ...p, followUpStatus: status } : p)),
        })),

      // ---------------- ANNOUNCEMENTS (v0.4) ----------------
      createAnnouncement: ({ title, message, expiryDate }) => {
        if (!title.trim()) return 'Announcement title can\'t be empty.'
        if (!message.trim()) return 'Announcement message can\'t be empty.'
        if (expiryDate < todayISO()) return 'Expiry date can\'t be in the past.'
        const ann: Announcement = {
          id: uid('ann'),
          title: title.trim(),
          message: message.trim(),
          createdAt: todayISO(),
          expiryDate,
          published: true,
        }
        set((s) => ({ announcements: [ann, ...s.announcements] }))
        return null
      },

      unpublishAnnouncement: (id) =>
        set((s) => ({
          announcements: s.announcements.map((a) => (a.id === id ? { ...a, published: false } : a)),
        })),

      deleteAnnouncement: (id) =>
        set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),

      // ---------------- AUDIT (v0.6) ----------------
      logAudit: (action, detail) => {
        const s = get()
        const actor = s.users.find((u) => u.id === s.currentUserId)
        const entry: AuditEntry = {
          id: uid('aud'),
          at: new Date().toISOString(),
          actorUserId: actor?.id ?? 'system',
          actorName: actor?.name ?? 'System',
          action,
          detail,
        }
        set((st) => ({ auditLog: [entry, ...st.auditLog].slice(0, 500) }))
      },

      // ---------------- FRIENDS & CREDIT TRANSFER (v0.6 §5) ----------------
      requestFriend: (emailOrMobile) => {
        const state = get()
        const me = state.currentUserId
        if (!me) return 'No active session.'
        const q = emailOrMobile.trim().toLowerCase()
        const target = state.users.find(
          (u) => u.email.toLowerCase() === q || u.mobile.replace(/\s/g, '') === q.replace(/\s/g, ''),
        )
        if (!target) return 'That email/mobile isn\'t registered. Friends must be registered users.'
        if (target.id === me) return 'You can\'t add yourself as a friend.'
        const exists = state.friends.find(
          (f) =>
            (f.requesterUserId === me && f.addresseeUserId === target.id) ||
            (f.requesterUserId === target.id && f.addresseeUserId === me),
        )
        if (exists) return 'You already have a friend link (or pending request) with this person.'
        const friend: Friend = { id: uid('frn'), requesterUserId: me, addresseeUserId: target.id, status: 'pending' }
        set((s) => ({ friends: [...s.friends, friend] }))
        return null
      },

      acceptFriend: (friendId) =>
        set((s) => ({ friends: s.friends.map((f) => (f.id === friendId ? { ...f, status: 'active' } : f)) })),

      declineFriend: (friendId) =>
        set((s) => ({ friends: s.friends.filter((f) => f.id !== friendId) })),

      removeFriend: (friendId) =>
        set((s) => ({ friends: s.friends.filter((f) => f.id !== friendId) })),

      // Transfer package sessions to a confirmed Friend. Transferred credit keeps the
      // original expiry date and records a full audit trail (v0.6 §5).
      transferCredit: ({ fromPackageId, toUserId, sessions }) => {
        const state = get()
        const me = state.currentUserId
        if (!me) return 'No active session.'
        if (!Number.isFinite(sessions) || sessions <= 0) return 'Enter how many sessions to transfer.'
        const confirmed = state.friends.some(
          (f) =>
            f.status === 'active' &&
            ((f.requesterUserId === me && f.addresseeUserId === toUserId) ||
              (f.requesterUserId === toUserId && f.addresseeUserId === me)),
        )
        if (!confirmed) return 'You can only transfer to a confirmed friend.'
        const pkg = state.patientPackages.find((p) => p.id === fromPackageId && p.ownerUserId === me)
        if (!pkg) return 'Package not found.'
        if (pkg.expiryDate < todayISO()) return 'This package has expired and can\'t be transferred.'
        if (sessions > pkg.remaining) return 'You don\'t have that many sessions to transfer.'

        const recipientPkg: PatientPackage = {
          id: uid('pp'),
          definitionId: pkg.definitionId,
          name: `${pkg.name} (from friend)`,
          ownerUserId: toUserId,
          totalSessions: sessions,
          remaining: sessions,
          assignDate: todayISO(),
          expiryDate: pkg.expiryDate, // retains original expiry
          status: 'active',
          sourcePackageId: pkg.id,
          transferredFromUserId: me,
        }
        const transfer: CreditTransfer = {
          id: uid('xfer'),
          at: new Date().toISOString(),
          fromUserId: me,
          toUserId,
          sessions,
          originalPackageId: pkg.id,
          recipientPackageId: recipientPkg.id,
          expiryDate: pkg.expiryDate,
          reversed: false,
        }
        set((s) => ({
          patientPackages: [
            ...s.patientPackages.map((p) => (p.id === pkg.id ? recomputePackage({ ...p, remaining: p.remaining - sessions }) : p)),
            recipientPkg,
          ],
          creditTransfers: [transfer, ...s.creditTransfers],
        }))
        const from = state.users.find((u) => u.id === me)
        const to = state.users.find((u) => u.id === toUserId)
        get().logAudit('Transfer package credit', `${sessions} session(s): ${from?.name ?? me} -> ${to?.name ?? toUserId}`)
        return null
      },
    }),
    {
      name: 'kuya-bong-store',
      version: 9,
      // v2 introduces service types, therapists, cancellation reasons, and a
      // duration-aware availability model (replacing fixed slots). v3 adds a
      // next-week demo appointment. v4 adds a second demo patient (Ahmed) with
      // his own next-week appointment. Backfill for older persisted stores so
      // existing data survives.
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown> | undefined
        if (!state) return persisted as unknown as AppState
        if (version < 2) {
          state.services = state.services ?? seedServices
          state.therapists = state.therapists ?? seedTherapists
          state.cancellationReasons = state.cancellationReasons ?? seedCancellationReasons
          state.availability = state.availability ?? generateAvailability()
          delete state.slots
          state.appointments = (Array.isArray(state.appointments) ? state.appointments : []).map((a) => {
            const apt = a as Record<string, unknown>
            return {
              ...apt,
              serviceTypeId: apt.serviceTypeId ?? 'svc-physio',
              therapistId: apt.therapistId ?? 'th-bong',
            }
          })
        }
        if (version < 3) {
          const appts = Array.isArray(state.appointments) ? state.appointments : []
          if (!appts.some((a) => (a as Record<string, unknown>).id === 'apt-3')) {
            const demo = seedAppointments().find((a) => a.id === 'apt-3')
            if (demo) state.appointments = [...appts, demo]
          }
        }
        if (version < 4) {
          const users = Array.isArray(state.users) ? state.users : []
          if (!users.some((u) => (u as Record<string, unknown>).id === 'u-pat-2')) {
            const u = seedUsers.find((u) => u.id === 'u-pat-2')
            if (u) state.users = [...users, u]
          }
          const profiles = Array.isArray(state.profiles) ? state.profiles : []
          if (!profiles.some((p) => (p as Record<string, unknown>).id === 'p-2')) {
            const p = seedProfiles.find((p) => p.id === 'p-2')
            if (p) state.profiles = [...profiles, p]
          }
          const appts = Array.isArray(state.appointments) ? state.appointments : []
          if (!appts.some((a) => (a as Record<string, unknown>).id === 'apt-4')) {
            const demo = seedAppointments().find((a) => a.id === 'apt-4')
            if (demo) state.appointments = [...appts, demo]
          }
        }
        if (version < 5) {
          // v0.4: designate the Master Admin and add a demo sub-admin.
          let users = (Array.isArray(state.users) ? state.users : []) as Record<string, unknown>[]
          users = users.map((u) => (u.id === 'u-admin' ? { ...u, name: 'Kuya Bong', adminLevel: 'master' } : u))
          if (!users.some((u) => u.id === 'u-sub')) {
            const sub = seedUsers.find((u) => u.id === 'u-sub')
            if (sub) users = [...users, sub as unknown as Record<string, unknown>]
          }
          state.users = users
        }
        if (version < 6) {
          // v0.4: announcements feature.
          if (!Array.isArray(state.announcements)) state.announcements = seedAnnouncements()
        }
        if (version < 7) {
          // v0.6: central sub-admin permission profile + audit log.
          if (!state.subAdminPermissions) state.subAdminPermissions = seedSubAdminPermissions
          if (!Array.isArray(state.auditLog)) state.auditLog = []
        }
        if (version < 8) {
          // v0.6: friends + package-credit transfer.
          if (!Array.isArray(state.friends)) state.friends = []
          if (!Array.isArray(state.creditTransfers)) state.creditTransfers = []
        }
        if (version < 9) {
          // v0.7: physiotherapist-as-user demo. Add Dr. Lina, link her therapist
          // record, and assign apt-4 to her so "My Schedule" isn't empty.
          const users = Array.isArray(state.users) ? state.users : []
          if (!users.some((u) => (u as Record<string, unknown>).id === 'u-physio')) {
            const physio = seedUsers.find((u) => u.id === 'u-physio')
            if (physio) state.users = [...users, physio]
          }
          state.therapists = (Array.isArray(state.therapists) ? state.therapists : []).map((t) => {
            const th = t as Record<string, unknown>
            return th.id === 'th-brother' ? { ...th, name: 'Dr. Lina', userId: 'u-physio', active: true } : th
          })
          state.appointments = (Array.isArray(state.appointments) ? state.appointments : []).map((a) => {
            const apt = a as Record<string, unknown>
            return apt.id === 'apt-4'
              ? { ...apt, therapistId: 'th-brother', clinicId: 'clinic-a', start: '13:00', end: '16:00' }
              : apt
          })
        }
        return state as unknown as AppState
      },
    },
  ),
)
