/**
 * Tipe domain Realief Expert (Section 15 blueprint).
 * Dipisah dari logika mock agar bisa dipakai ulang sebagai tipe SDK backend nanti.
 */

export type Role = 'patient' | 'admin'

export type VerificationStatus = 'unverified' | 'verified'

export interface User {
  id: string
  role: Role
  name: string
  mobile: string
  email: string
  password: string // mock saja — JANGAN dipakai untuk produksi
  verification: VerificationStatus
}

export interface PatientProfile {
  id: string
  userId: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  emergencyContact?: string
  familyGroupId: string
}

export type RelationshipType = 'spouse' | 'child' | 'adult' | 'dependent'
export type FamilyLinkStatus = 'pending' | 'active'

export interface FamilyMember {
  id: string
  familyGroupId: string
  name: string
  relationship: RelationshipType
  /** Untuk anak: tidak punya login sendiri. */
  isChild: boolean
  linkedUserId?: string // jika dewasa terdaftar
  parentUserId?: string // jika anak
  status: FamilyLinkStatus
}

export interface Clinic {
  id: string
  name: string
  address: string
  active: boolean
}

export type SlotStatus = 'available' | 'booked'

export interface AppointmentSlot {
  id: string
  clinicId: string
  date: string // YYYY-MM-DD
  start: string // HH:mm
  end: string // HH:mm
  status: SlotStatus
}

export type AppointmentStatus =
  | 'PendingApproval'
  | 'Confirmed'
  | 'Rescheduled'
  | 'CancelledByPatient'
  | 'CancelledByAdmin'
  | 'Completed'
  | 'NoShow'

export type BookingSource = 'App' | 'Manual'

export interface Appointment {
  id: string
  slotId: string
  clinicId: string
  date: string
  start: string
  end: string
  patientUserId: string
  /** Siapa yang akan dirawat (pasien sendiri atau anggota keluarga). */
  forMemberId?: string
  forMemberName: string
  status: AppointmentStatus
  source: BookingSource
  note?: string
  createdAt: string
}

export interface PackageDefinition {
  id: string
  name: string
  sessions: number
  validityDays: number
}

export type PackageStatus = 'active' | 'expired' | 'used'

export interface PatientPackage {
  id: string
  definitionId: string
  name: string
  ownerUserId: string
  totalSessions: number
  remaining: number
  assignDate: string
  expiryDate: string
  status: PackageStatus
}

export interface PackageUsage {
  id: string
  patientPackageId: string
  appointmentId: string
  memberName: string
  date: string
  recordedBy: string
}

export type ProductCategory = 'herbal' | 'supplement' | 'other'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  active: boolean
  notes?: string
}

export type FollowUpStatus = 'NotDue' | 'Due' | 'Contacted' | 'Completed'

export interface ProductPurchase {
  id: string
  patientUserId: string
  productId: string
  productName: string
  unitPriceAtSale: number // snapshot harga (BR: tidak berubah saat harga katalog diupdate)
  quantity: number
  purchaseDate: string
  estimatedFollowUpDate?: string
  followUpStatus: FollowUpStatus
  notes?: string
}
