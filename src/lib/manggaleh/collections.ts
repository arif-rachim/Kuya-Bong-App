/**
 * Collection (table) names in the manggaleh project + a typed accessor.
 * The full column schema for each is documented in
 * docs/manggaleh-integration-plan.md (create these in the manggaleh console).
 */
import { mg } from './client'

export const COLLECTIONS = {
  profiles: 'patient_profiles',
  clinics: 'clinics',
  services: 'service_types',
  therapists: 'therapists',
  availability: 'therapist_availability',
  appointments: 'appointments',
  packageDefs: 'package_definitions',
  patientPackages: 'patient_packages',
  packageUsage: 'package_usage',
  products: 'products',
  purchases: 'product_purchases',
  announcements: 'announcements',
  cancellationReasons: 'cancellation_reasons',
  friends: 'friends',
  creditTransfers: 'credit_transfers',
  auditLog: 'audit_log',
  subAdminPermissions: 'sub_admin_permissions',
} as const

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]

/** Typed handle to a collection: coll<Row>(COLLECTIONS.clinics).list()/insert()/... */
export function coll<T = Record<string, unknown>>(name: CollectionName) {
  return mg().data.from<T>(name)
}
