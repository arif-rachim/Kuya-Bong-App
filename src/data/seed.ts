/** Initial (mock) data for the demo. Called when the store is first initialized. */
import { addDays, addMonths, todayISO } from '../lib/date'
import type {
  Appointment,
  AppointmentSlot,
  Clinic,
  FamilyMember,
  PackageDefinition,
  PatientPackage,
  PatientProfile,
  Product,
  ProductPurchase,
  User,
} from './types'

export const FAMILY_GROUP = 'fam-1'

export const seedUsers: User[] = [
  {
    id: 'u-admin',
    role: 'admin',
    name: 'Realief Expert',
    mobile: '+971501234567',
    email: 'admin@reliefexpert.app',
    password: 'admin123',
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
]

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

const SLOT_TIMES = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

/** Generate 60-minute slots for the next 14 days, both clinics. */
export function generateSlots(): AppointmentSlot[] {
  const slots: AppointmentSlot[] = []
  const base = todayISO()
  for (let d = 0; d < 14; d++) {
    const date = addDays(base, d)
    for (const clinicId of ['clinic-a', 'clinic-b']) {
      // clinic B opens at different hours to feel distinct
      const times = clinicId === 'clinic-a' ? SLOT_TIMES : SLOT_TIMES.slice(2)
      for (const start of times) {
        const end = `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:00`
        slots.push({
          id: `slot-${clinicId}-${date}-${start}`,
          clinicId,
          date,
          start,
          end,
          status: 'available',
        })
      }
    }
  }
  return slots
}

export function seedAppointments(): Appointment[] {
  const today = todayISO()
  return [
    {
      id: 'apt-1',
      slotId: `slot-clinic-a-${today}-10:00`,
      clinicId: 'clinic-a',
      date: today,
      start: '10:00',
      end: '11:00',
      patientUserId: 'u-pat-1',
      forMemberName: 'Maria Santos',
      status: 'Confirmed',
      source: 'App',
      createdAt: today,
    },
    {
      id: 'apt-2',
      slotId: `slot-clinic-b-${addDays(today, 3)}-13:00`,
      clinicId: 'clinic-b',
      date: addDays(today, 3),
      start: '13:00',
      end: '14:00',
      patientUserId: 'u-pat-1',
      forMemberName: 'Jose Santos',
      status: 'Confirmed',
      source: 'Manual',
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
