/** Initial (mock) data for the demo. Called when the store is first initialized. */
import { addDays, addMonths, todayISO } from '../lib/date'
import type {
  Announcement,
  Appointment,
  CancellationReason,
  Clinic,
  FamilyMember,
  PackageDefinition,
  PatientPackage,
  PatientProfile,
  Product,
  ProductPurchase,
  ServiceType,
  Therapist,
  TherapistAvailability,
  User,
} from './types'

export const FAMILY_GROUP = 'fam-1'

export const seedUsers: User[] = [
  {
    id: 'u-admin',
    role: 'admin',
    adminLevel: 'master',
    name: 'Kuya Bong',
    mobile: '+971501234567',
    email: 'admin@reliefexpert.app',
    password: 'admin123',
    verification: 'verified',
  },
  {
    id: 'u-sub',
    role: 'admin',
    adminLevel: 'sub',
    name: 'Erick (Sub-Admin)',
    mobile: '+971503334444',
    email: 'staff@reliefexpert.app',
    password: 'staff123',
    verification: 'verified',
  },
  {
    id: 'u-pat-1',
    role: 'patient',
    name: 'Maria Santos',
    mobile: '+971529876543',
    email: 'maria@example.com',
    password: 'patient123',
    verification: 'verified',
  },
  {
    id: 'u-pat-2',
    role: 'patient',
    name: 'Ahmed Rahman',
    mobile: '+971544112233',
    email: 'ahmed@example.com',
    password: 'patient123',
    verification: 'verified',
  },
]

export const FAMILY_GROUP_2 = 'fam-2'

export const seedProfiles: PatientProfile[] = [
  {
    id: 'p-1',
    userId: 'u-pat-1',
    dateOfBirth: '1965-04-12',
    gender: 'female',
    address: 'Dubai Marina, Dubai',
    emergencyContact: '+971552345678',
    familyGroupId: FAMILY_GROUP,
  },
  {
    id: 'p-2',
    userId: 'u-pat-2',
    dateOfBirth: '1980-09-21',
    gender: 'male',
    address: 'Al Barsha, Dubai',
    emergencyContact: '+971557788990',
    familyGroupId: FAMILY_GROUP_2,
  },
]

export const seedFamily: FamilyMember[] = [
  {
    id: 'fm-child-1',
    familyGroupId: FAMILY_GROUP,
    name: 'Jose Santos',
    relationship: 'child',
    isChild: true,
    parentUserId: 'u-pat-1',
    status: 'active',
  },
]

export const seedClinics: Clinic[] = [
  { id: 'clinic-a', name: 'Clinic A', address: 'Jumeirah Beach Rd 12, Dubai', active: true },
  { id: 'clinic-b', name: 'Clinic B', address: 'Al Falah St 88, Abu Dhabi', active: true },
]

export const seedServices: ServiceType[] = [
  { id: 'svc-physio', name: 'Physiotherapy & Massage', durationMinutes: 180, active: true },
  { id: 'svc-grounding', name: 'Grounding Machine Therapy', durationMinutes: 120, active: true },
]

export const seedTherapists: Therapist[] = [
  { id: 'th-bong', name: 'Kuya Bong', active: true },
  { id: 'th-brother', name: 'Kuya Bong\'s Brother', active: true },
]

export const seedCancellationReasons: CancellationReason[] = [
  { id: 'cr-unavailable', label: 'Patient is not available', active: true },
  { id: 'cr-sick', label: 'Patient is sick', active: true },
  { id: 'cr-emergency', label: 'Emergency', active: true },
  { id: 'cr-wrong-clinic', label: 'Booked wrong clinic', active: true },
  { id: 'cr-wrong-time', label: 'Booked wrong date or time', active: true },
  { id: 'cr-other', label: 'Other', active: true },
]

/**
 * Generate therapist working windows for the next 14 days.
 * Kuya Bong covers both clinics; his brother helps at Clinic A in the afternoon.
 */
export function generateAvailability(): TherapistAvailability[] {
  const out: TherapistAvailability[] = []
  const base = todayISO()
  for (let d = 0; d < 14; d++) {
    const date = addDays(base, d)
    out.push({ id: `av-bong-a-${date}`, therapistId: 'th-bong', clinicId: 'clinic-a', date, start: '09:00', end: '17:00' })
    out.push({ id: `av-bong-b-${date}`, therapistId: 'th-bong', clinicId: 'clinic-b', date, start: '11:00', end: '17:00' })
    out.push({ id: `av-bro-a-${date}`, therapistId: 'th-brother', clinicId: 'clinic-a', date, start: '13:00', end: '17:00' })
  }
  return out
}

export function seedAppointments(): Appointment[] {
  const today = todayISO()
  return [
    {
      id: 'apt-1',
      clinicId: 'clinic-a',
      serviceTypeId: 'svc-physio',
      therapistId: 'th-bong',
      date: today,
      start: '10:00',
      end: '13:00', // 3-hour Physiotherapy & Massage
      patientUserId: 'u-pat-1',
      forMemberName: 'Maria Santos',
      status: 'Confirmed',
      source: 'App',
      createdAt: today,
    },
    {
      id: 'apt-2',
      clinicId: 'clinic-b',
      serviceTypeId: 'svc-grounding',
      therapistId: 'th-bong',
      date: addDays(today, 3),
      start: '13:00',
      end: '15:00', // 2-hour Grounding Machine Therapy
      patientUserId: 'u-pat-1',
      forMemberName: 'Jose Santos',
      status: 'Confirmed',
      source: 'Manual',
      createdAt: today,
    },
    {
      // Next-week appointment so reschedule/cancel (with reason picker) can be
      // demoed — it's well outside the 24h cutoff, so the buttons stay enabled.
      id: 'apt-3',
      clinicId: 'clinic-a',
      serviceTypeId: 'svc-grounding',
      therapistId: 'th-bong',
      date: addDays(today, 7),
      start: '14:00',
      end: '16:00', // 2-hour Grounding Machine Therapy
      patientUserId: 'u-pat-1',
      forMemberName: 'Maria Santos',
      status: 'Confirmed',
      source: 'App',
      createdAt: today,
    },
    {
      // A second patient (Ahmed) with a next-week booking, so the cancel /
      // reschedule demo isn't limited to a single patient.
      id: 'apt-4',
      clinicId: 'clinic-a',
      serviceTypeId: 'svc-physio',
      therapistId: 'th-bong',
      date: addDays(today, 8),
      start: '09:00',
      end: '12:00', // 3-hour Physiotherapy & Massage
      patientUserId: 'u-pat-2',
      forMemberName: 'Ahmed Rahman',
      status: 'Confirmed',
      source: 'App',
      createdAt: today,
    },
  ]
}

export const seedPackageDefs: PackageDefinition[] = [
  { id: 'pkg-6', name: '6-Session Package', sessions: 6, validityDays: 90 },
  { id: 'pkg-10', name: '10-Session Package', sessions: 10, validityDays: 180 },
]

export function seedPatientPackages(): PatientPackage[] {
  const assignDate = addDays(todayISO(), -10)
  return [
    {
      id: 'pp-1',
      definitionId: 'pkg-6',
      name: '6-Session Package',
      ownerUserId: 'u-pat-1',
      totalSessions: 6,
      remaining: 4,
      assignDate,
      expiryDate: addMonths(assignDate, 3),
      status: 'active',
    },
  ]
}

export function seedAnnouncements(): Announcement[] {
  const today = todayISO()
  return [
    {
      id: 'ann-1',
      title: 'Buy One Get One Free',
      message: 'This week only: buy any herbal product and get a second one free. Ask Kuya at your next visit!',
      createdAt: addDays(today, -2),
      expiryDate: addDays(today, 12),
      published: true,
    },
    {
      id: 'ann-2',
      title: 'Clinic B Maintenance',
      message: 'Clinic B will be closed for maintenance next Monday. Please book at Clinic A for that day.',
      createdAt: addDays(today, -1),
      expiryDate: addDays(today, 6),
      published: true,
    },
  ]
}

export const seedProducts: Product[] = [
  { id: 'prod-1', name: 'Herbal Joint Relief', category: 'herbal', price: 450, active: true, notes: 'For joint pain' },
  { id: 'prod-2', name: 'Magnesium Complex', category: 'supplement', price: 380, active: true },
  { id: 'prod-3', name: 'Muscle Recovery Balm', category: 'herbal', price: 250, active: true },
  { id: 'prod-4', name: 'Old Tonic (discontinued)', category: 'other', price: 200, active: false },
]

export function seedPurchases(): ProductPurchase[] {
  return [
    {
      id: 'pur-1',
      patientUserId: 'u-pat-1',
      productId: 'prod-1',
      productName: 'Herbal Joint Relief',
      unitPriceAtSale: 420,
      quantity: 1,
      purchaseDate: addDays(todayISO(), -25),
      estimatedFollowUpDate: addDays(todayISO(), 5),
      followUpStatus: 'Due',
      notes: 'Restock in ~30 days',
    },
  ]
}
