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
import {
  FAMILY_GROUP,
  generateSlots,
  seedAppointments,
  seedClinics,
  seedFamily,
  seedPackageDefs,
  seedPatientPackages,
  seedProducts,
  seedProfiles,
  seedPurchases,
  seedUsers,
} from '../data/seed'
import type {
  Appointment,
  AppointmentSlot,
  Clinic,
  FamilyMember,
  PackageDefinition,
  PackageUsage,
  PatientPackage,
  PatientProfile,
  Product,
  ProductCategory,
  ProductPurchase,
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
  slots: AppointmentSlot[]
  appointments: Appointment[]
  packageDefs: PackageDefinition[]
  patientPackages: PatientPackage[]
  packageUsage: PackageUsage[]
  products: Product[]
  purchases: ProductPurchase[]

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

  // ---- clinics ----
  updateClinicName: (id: string, name: string) => Result

  // ---- slots ----
  publishSlot: (clinicId: string, date: string, start: string) => Result
  removeSlot: (slotId: string) => Result

  // ---- appointments ----
  bookAppointment: (input: {
    slotId: string
    forMemberId?: string
    forMemberName: string
    source?: 'App' | 'Manual'
    patientUserId?: string
    note?: string
  }) => Result
  rescheduleAppointment: (appointmentId: string, newSlotId: string, by: 'patient' | 'admin') => Result
  cancelAppointment: (appointmentId: string, by: 'patient' | 'admin') => Result
  markCompleted: (appointmentId: string, patientPackageId?: string) => Result
  markNoShow: (appointmentId: string) => Result
  approveAppointment: (appointmentId: string) => void
  rejectAppointment: (appointmentId: string) => void

  // ---- packages ----
  createPackageDef: (name: string, sessions: number, validityDays: number) => Result
  assignPackage: (userId: string, definitionId: string) => Result

  // ---- family ----
  addChild: (parentUserId: string, name: string) => Result
  linkAdult: (parentUserId: string, emailOrMobile: string) => Result
  acceptLink: (familyMemberId: string) => void
  declineLink: (familyMemberId: string) => void

  // ---- products ----
  createProduct: (input: { name: string; category: ProductCategory; price: number; notes?: string }) => Result
  updateProduct: (id: string, patch: Partial<Pick<Product, 'name' | 'price' | 'category' | 'notes'>>) => Result
  toggleProductActive: (id: string) => void
  recordPurchase: (input: {
    patientUserId: string
    productId: string
    quantity: number
    followUpDays?: number
    notes?: string
  }) => Result
  setFollowUpStatus: (purchaseId: string, status: ProductPurchase['followUpStatus']) => void
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
      slots: mergeSeedSlots(),
      appointments: seedAppointments(),
      packageDefs: seedPackageDefs,
      patientPackages: seedPatientPackages(),
      packageUsage: [],
      products: seedProducts,
      purchases: seedPurchases(),
      currentUserId: null,
      requireApproval: false, // Q-07 default: auto-confirm. Admin can switch on manual approval.

      setRequireApproval: (value) => set({ requireApproval: value }),

      // ---------------- AUTH ----------------
      login: (email, password) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (!user || user.password !== password) return 'Incorrect email or password.'
        set({ currentUserId: user.id })
        return null
      },

      loginAs: (role) => {
        const user = get().users.find((u) => u.role === role && u.verification === 'verified')
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

      // ---------------- CLINICS ----------------
      updateClinicName: (id, name) => {
        if (!name.trim()) return 'Clinic name can\'t be empty.'
        set((s) => ({ clinics: s.clinics.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)) }))
        return null
      },

      // ---------------- SLOTS ----------------
      publishSlot: (clinicId, date, start) => {
        if (date < todayISO()) return 'Can\'t create a slot on a past date.'
        const dup = get().slots.find(
          (sl) => sl.clinicId === clinicId && sl.date === date && sl.start === start,
        )
        if (dup) return 'A slot at this time already exists (avoid duplicates/overlap).'
        const end = `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:00`
        const slot: AppointmentSlot = {
          id: uid('slot'),
          clinicId,
          date,
          start,
          end,
          status: 'available',
        }
        set((s) => ({ slots: [...s.slots, slot] }))
        return null
      },

      removeSlot: (slotId) => {
        const slot = get().slots.find((sl) => sl.id === slotId)
        if (!slot) return 'Slot not found.'
        if (slot.status === 'booked') return 'Slot is already booked — it can\'t be removed.'
        set((s) => ({ slots: s.slots.filter((sl) => sl.id !== slotId) }))
        return null
      },

      // ---------------- APPOINTMENTS ----------------
      bookAppointment: ({ slotId, forMemberId, forMemberName, source = 'App', patientUserId, note }) => {
        const state = get()
        const userId = patientUserId ?? state.currentUserId
        if (!userId) return 'No active session.'
        const user = state.users.find((u) => u.id === userId)
        if (!user) return 'Patient not found.'
        // BR-01: must be verified before booking (for bookings via App)
        if (source === 'App' && user.verification !== 'verified')
          return 'Your account must be verified before booking.'
        const slot = state.slots.find((sl) => sl.id === slotId)
        if (!slot) return 'Slot unavailable.'
        // BR-03: prevent double booking
        if (slot.status === 'booked') return 'That slot was just booked by someone else. Please choose another.'
        // a past slot is not allowed
        if (hoursUntil(slot.date, slot.start) < 0) return 'That slot has passed — please choose a valid time.'

        const apt: Appointment = {
          id: uid('apt'),
          slotId: slot.id,
          clinicId: slot.clinicId,
          date: slot.date,
          start: slot.start,
          end: slot.end,
          patientUserId: userId,
          forMemberId,
          forMemberName,
          // App bookings need approval when the admin enabled it (BR/Q-07);
          // admin/manual bookings are always confirmed immediately.
          status: source === 'App' && state.requireApproval ? 'PendingApproval' : 'Confirmed',
          source,
          note,
          createdAt: todayISO(),
        }
        set((s) => ({
          appointments: [...s.appointments, apt],
          slots: s.slots.map((sl) => (sl.id === slot.id ? { ...sl, status: 'booked' } : sl)),
        }))
        return null
      },

      rescheduleAppointment: (appointmentId, newSlotId, by) => {
        const state = get()
        const apt = state.appointments.find((a) => a.id === appointmentId)
        if (!apt) return 'Appointment not found.'
        // BR-05: cutoff (patients only)
        if (by === 'patient' && hoursUntil(apt.date, apt.start) < CANCEL_CUTOFF_HOURS)
          return `Rescheduling must be more than ${CANCEL_CUTOFF_HOURS} hours before the session.`
        const newSlot = state.slots.find((sl) => sl.id === newSlotId)
        if (!newSlot) return 'Target slot not found.'
        // BR-04: only to an available slot
        if (newSlot.status !== 'available') return 'Target slot is unavailable.'
        if (hoursUntil(newSlot.date, newSlot.start) < 0) return 'Target slot has passed.'
        // note: no package deduction — balance unchanged (BR-14)
        set((s) => ({
          slots: s.slots.map((sl) => {
            if (sl.id === apt.slotId) return { ...sl, status: 'available' }
            if (sl.id === newSlot.id) return { ...sl, status: 'booked' }
            return sl
          }),
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  status: 'Rescheduled',
                  slotId: newSlot.id,
                  clinicId: newSlot.clinicId,
                  date: newSlot.date,
                  start: newSlot.start,
                  end: newSlot.end,
                }
              : a,
          ),
        }))
        return null
      },

      cancelAppointment: (appointmentId, by) => {
        const state = get()
        const apt = state.appointments.find((a) => a.id === appointmentId)
        if (!apt) return 'Appointment not found.'
        if (by === 'patient' && hoursUntil(apt.date, apt.start) < CANCEL_CUTOFF_HOURS)
          return `Cancellation must be more than ${CANCEL_CUTOFF_HOURS} hours before the session.`
        // no package deduction on cancel (BR-14)
        set((s) => ({
          slots: s.slots.map((sl) => (sl.id === apt.slotId ? { ...sl, status: 'available' } : sl)),
          appointments: s.appointments.map((a) =>
            a.id === appointmentId
              ? { ...a, status: by === 'admin' ? 'CancelledByAdmin' : 'CancelledByPatient' }
              : a,
          ),
        }))
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

      rejectAppointment: (appointmentId) => {
        const apt = get().appointments.find((a) => a.id === appointmentId)
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, status: 'CancelledByAdmin' } : a,
          ),
          slots: apt
            ? s.slots.map((sl) => (sl.id === apt.slotId ? { ...sl, status: 'available' } : sl))
            : s.slots,
        }))
      },

      // ---------------- PACKAGES ----------------
      createPackageDef: (name, sessions, validityDays) => {
        if (!name.trim()) return 'Package name can\'t be empty.'
        if (sessions <= 0) return 'Number of sessions must be greater than 0.'
        if (validityDays <= 0) return 'Validity must be greater than 0 days.'
        const def: PackageDefinition = { id: uid('pkg'), name: name.trim(), sessions, validityDays }
        set((s) => ({ packageDefs: [...s.packageDefs, def] }))
        return null
      },

      assignPackage: (userId, definitionId) => {
        const def = get().packageDefs.find((d) => d.id === definitionId)
        if (!def) return 'Package definition not found.'
        const assignDate = todayISO()
        const pp: PatientPackage = {
          id: uid('pp'),
          definitionId: def.id,
          name: def.name,
          ownerUserId: userId,
          totalSessions: def.sessions,
          remaining: def.sessions,
          assignDate,
          expiryDate: addDays(assignDate, def.validityDays),
          status: 'active',
        }
        set((s) => ({ patientPackages: [...s.patientPackages, pp] }))
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

      // ---------------- PRODUCTS ----------------
      createProduct: ({ name, category, price, notes }) => {
        if (!name.trim()) return 'Product name can\'t be empty.'
        if (price < 0) return 'Invalid price.'
        const productNew: Product = { id: uid('prod'), name: name.trim(), category, price, active: true, notes }
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
    }),
    {
      name: 'kuya-bong-store',
      version: 1,
    },
  ),
)

// --- seed helper: mark slots that already have an appointment as booked ---
function mergeSeedSlots(): AppointmentSlot[] {
  const slots = generateSlots()
  const apts = seedAppointments()
  return slots.map((sl) =>
    apts.some((a) => a.slotId === sl.id) ? { ...sl, status: 'booked' } : sl,
  )
}
