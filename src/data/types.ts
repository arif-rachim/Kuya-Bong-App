/**
 * Realief Expert domain types (Section 15 blueprint).
 * Kept separate from the mock logic so they can be reused as backend SDK types later.
 */

export type Role = 'patient' | 'admin'

export type VerificationStatus = 'unverified' | 'verified'

export interface User {
  id: string
  role: Role
  /** For admins only: 'master' (Kuya) can manage core data & sub-admins; 'sub' helps with daily ops. */
  adminLevel?: 'master' | 'sub'
  name: string
  mobile: string
  email: string
  password: string // mock only — DO NOT use in production
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
  /** For a child: has no login of their own. */
  isChild: boolean
  linkedUserId?: string // if a registered adult
  parentUserId?: string // if a child
  status: FamilyLinkStatus
}

export interface Clinic {
  id: string
  name: string
  address: string
  active: boolean
}

/**
 * A bookable service offered by the clinic (blueprint Section 25.1).
 * Each appointment is linked to one service, and the service duration drives
 * the appointment end time and the available booking start times.
 */
export interface ServiceType {
  id: string
  name: string
  durationMinutes: number
  active: boolean
  notes?: string
}

/** A therapist who can be assigned to appointments (blueprint Section 25.3). */
export interface Therapist {
  id: string
  name: string
  active: boolean
}

/** A reason a patient or admin can pick when cancelling (blueprint Section 25.5). */
export interface CancellationReason {
  id: string
  label: string
  active: boolean
}

/**
 * A therapist's working window for a clinic on a date (blueprint Section 25.2).
 * Bookable start times are derived from these windows + the selected service
 * duration, rather than from pre-cut fixed slots.
 */
export interface TherapistAvailability {
  id: string
  therapistId: string
  clinicId: string
  date: string // YYYY-MM-DD
  start: string // HH:mm
  end: string // HH:mm
}

export type AppointmentStatus =
  | 'PendingApproval'
  | 'Confirmed'
  | 'Rescheduled'
  | 'CancelledByPatient'
  | 'CancelledByAdmin'
  | 'Completed'
  | 'NoShow'

export type BookingSource = 'App' | 'Manual' | 'Phone' | 'Other'

export interface Appointment {
  id: string
  clinicId: string
  serviceTypeId: string
  therapistId: string
  date: string
  start: string
  end: string // calculated from the service duration
  patientUserId: string
  /** Who will be treated (the patient themselves or a family member). */
  forMemberId?: string
  forMemberName: string
  status: AppointmentStatus
  source: BookingSource
  note?: string
  createdAt: string
  // ---- cancellation (Section 25.5/25.6) ----
  cancelledBy?: 'patient' | 'admin'
  cancellationReasonId?: string
  cancellationNote?: string
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

/** Admin announcement pushed to customers (blueprint v0.4 §2). */
export interface Announcement {
  id: string
  title: string
  message: string
  createdAt: string // YYYY-MM-DD
  expiryDate: string // YYYY-MM-DD — auto-hidden after this date
  published: boolean // false once manually pulled/unpublished
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
  unitPriceAtSale: number // price snapshot (BR: unchanged when the catalog price is updated)
  quantity: number
  purchaseDate: string
  estimatedFollowUpDate?: string
  followUpStatus: FollowUpStatus
  notes?: string
}
