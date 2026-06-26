/**
 * Read-side data access over manggaleh collections, mapped to the app's domain
 * types (snake_case rows -> camelCase). Verified against realief-expert/dev:
 * shared/catalog tables are readable by any logged-in user; owner-scoped tables
 * return only the caller's own rows.
 */
import { coll, COLLECTIONS } from './collections'
import type {
  Announcement, Appointment, CancellationReason, Clinic, CreditTransfer, Friend,
  PackageDefinition, PatientPackage, PatientProfile, Product, ProductPurchase,
  ServiceType, SubAdminPermissions, Therapist, TherapistAvailability,
} from '../../data/types'

type Row = Record<string, any>
const PAGE = 200
const bool = (v: any) => v !== false
// manggaleh `date`/`timestamptz` columns come back as ISO strings — keep YYYY-MM-DD.
const d10 = (v: any): string => (typeof v === 'string' ? v.slice(0, 10) : '')

// ---------- mappers ----------
const toClinic = (r: Row): Clinic => ({ id: r.id, name: r.name, address: r.address ?? '', active: bool(r.active) })
const toService = (r: Row): ServiceType => ({ id: r.id, name: r.name, durationMinutes: r.duration_minutes, active: bool(r.active), notes: r.notes ?? undefined })
const toTherapist = (r: Row): Therapist => ({ id: r.id, name: r.name, active: bool(r.active), userId: r.user_id ?? undefined })
const toAvailability = (r: Row): TherapistAvailability => ({ id: r.id, therapistId: r.therapist_id, clinicId: r.clinic_id, date: d10(r.date), start: r.start, end: r.end })
const toReason = (r: Row): CancellationReason => ({ id: r.id, label: r.label, active: bool(r.active) })
const toPackageDef = (r: Row): PackageDefinition => ({ id: r.id, name: r.name, sessions: r.sessions, validityDays: r.validity_days })
const toProduct = (r: Row): Product => ({ id: r.id, name: r.name, category: r.category ?? 'other', price: Number(r.price), active: bool(r.active), notes: r.notes ?? undefined, images: Array.isArray(r.image_object_ids) ? r.image_object_ids : undefined })
const toAnnouncement = (r: Row): Announcement => ({ id: r.id, title: r.title, message: r.message, createdAt: (r.created_at ?? '').slice(0, 10), expiryDate: d10(r.expiry_date), published: bool(r.published) })
const toAppointment = (r: Row): Appointment => ({
  id: r.id, clinicId: r.clinic_id, serviceTypeId: r.service_type_id, therapistId: r.therapist_id,
  date: d10(r.date), start: r.start, end: r.end, patientUserId: r.patient_user_id,
  forMemberId: r.for_member_id ?? undefined, forMemberName: r.for_member_name ?? '',
  status: r.status, source: r.source ?? 'App', note: r.note ?? undefined,
  createdAt: (r.created_at ?? '').slice(0, 10),
  cancelledBy: r.cancelled_by ?? undefined, cancellationReasonId: r.cancellation_reason_id ?? undefined, cancellationNote: r.cancellation_note ?? undefined,
})
const toPatientPackage = (r: Row): PatientPackage => ({
  id: r.id, definitionId: r.definition_id ?? '', name: r.name, ownerUserId: r.owner_user_id,
  totalSessions: r.total_sessions, remaining: r.remaining, assignDate: d10(r.assign_date), expiryDate: d10(r.expiry_date),
  status: r.status, sourcePackageId: r.source_package_id ?? undefined, transferredFromUserId: r.transferred_from_user_id ?? undefined,
})
const toFriend = (r: Row): Friend => ({ id: r.id, requesterUserId: r.requester_user_id, addresseeUserId: r.addressee_user_id, status: r.status })
const toTransfer = (r: Row): CreditTransfer => ({ id: r.id, at: r.created_at ?? '', fromUserId: r.from_user_id, toUserId: r.to_user_id, sessions: r.sessions, originalPackageId: r.original_package_id ?? '', recipientPackageId: r.recipient_package_id ?? '', expiryDate: d10(r.expiry_date), reversed: !!r.reversed })
const toPurchase = (r: Row): ProductPurchase => ({ id: r.id, patientUserId: r.patient_user_id, productId: r.product_id ?? '', productName: r.product_name ?? '', unitPriceAtSale: Number(r.unit_price_at_sale ?? 0), quantity: r.quantity ?? 1, purchaseDate: d10(r.purchase_date), estimatedFollowUpDate: r.estimated_follow_up_date ? d10(r.estimated_follow_up_date) : undefined, followUpStatus: r.follow_up_status ?? 'NotDue', notes: r.notes ?? undefined })
const toProfile = (r: Row): PatientProfile => ({ id: r.id, userId: r.user_id, dateOfBirth: r.date_of_birth ?? undefined, gender: r.gender ?? undefined, address: r.address ?? undefined, emergencyContact: r.emergency_contact ?? undefined, familyGroupId: r.family_group_id ?? '' })

const SUBADMIN_KEYS = [
  'manage_booking', 'appointment_management', 'manage_clinics', 'manage_therapists', 'manage_patients',
  'manage_products', 'manage_services', 'manage_cancellation_reasons', 'manage_announcements',
  'manage_follow_up', 'reports_services', 'reports_products',
] as const
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
function toSubAdminPermissions(r: Row): SubAdminPermissions {
  const out = {} as SubAdminPermissions
  for (const k of SUBADMIN_KEYS) (out as any)[camel(k)] = !!r[k]
  return out
}

// ---------- catalog reads (any logged-in user) ----------
export const listClinics = async () => (await coll(COLLECTIONS.clinics).list({ limit: PAGE })).map(toClinic)
export const listServices = async () => (await coll(COLLECTIONS.services).list({ limit: PAGE })).map(toService)
export const listTherapists = async () => (await coll(COLLECTIONS.therapists).list({ limit: PAGE })).map(toTherapist)
export const listAvailability = async () => (await coll(COLLECTIONS.availability).list({ limit: PAGE })).map(toAvailability)
export const listCancellationReasons = async () => (await coll(COLLECTIONS.cancellationReasons).list({ limit: PAGE })).map(toReason)
export const listPackageDefs = async () => (await coll(COLLECTIONS.packageDefs).list({ limit: PAGE })).map(toPackageDef)
export const listProducts = async () => (await coll(COLLECTIONS.products).list({ limit: PAGE })).map(toProduct)
export const listAnnouncements = async () => (await coll(COLLECTIONS.announcements).list({ limit: PAGE })).map(toAnnouncement)
export async function getSubAdminPermissions(): Promise<SubAdminPermissions | null> {
  const rows = await coll(COLLECTIONS.subAdminPermissions).list({ limit: 1 })
  return rows[0] ? toSubAdminPermissions(rows[0]) : null
}

// ---------- owner-scoped reads (the caller's own rows) ----------
export const listMyAppointments = async () => (await coll(COLLECTIONS.appointments).list({ limit: PAGE })).map(toAppointment)
export const listMyPackages = async () => (await coll(COLLECTIONS.patientPackages).list({ limit: PAGE })).map(toPatientPackage)
export const listMyFriends = async () => (await coll(COLLECTIONS.friends).list({ limit: PAGE })).map(toFriend)
export const listMyTransfers = async () => (await coll(COLLECTIONS.creditTransfers).list({ limit: PAGE })).map(toTransfer)
export const listMyPurchases = async () => (await coll(COLLECTIONS.purchases).list({ limit: PAGE })).map(toPurchase)
export async function getMyProfile(): Promise<PatientProfile | null> {
  const rows = await coll(COLLECTIONS.profiles).list({ limit: 1 })
  return rows[0] ? toProfile(rows[0]) : null
}
