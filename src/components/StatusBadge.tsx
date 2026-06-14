import { cn } from '../lib/cn'
import { Icon } from './Icon'
import type { AppointmentStatus, PackageStatus } from '../data/types'

const APT_LABEL: Record<AppointmentStatus, { label: string; cls: string }> = {
  PendingApproval: { label: 'Pending Approval', cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  Confirmed: { label: 'Confirmed', cls: 'bg-primary-fixed text-on-primary-fixed-variant' },
  Rescheduled: { label: 'Rescheduled', cls: 'bg-secondary-container text-on-secondary-container' },
  CancelledByPatient: { label: 'Cancelled (Patient)', cls: 'bg-error-container text-on-error-container' },
  CancelledByAdmin: { label: 'Cancelled (Admin)', cls: 'bg-error-container text-on-error-container' },
  Completed: { label: 'Completed', cls: 'bg-primary-fixed text-on-primary-fixed-variant' },
  NoShow: { label: 'No-Show', cls: 'bg-surface-container-highest text-on-surface-variant' },
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const s = APT_LABEL[status]
  return <span className={cn('rounded-full px-sm py-xs font-label-md text-label-md', s.cls)}>{s.label}</span>
}

const PKG_LABEL: Record<PackageStatus, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-primary-fixed text-on-primary-fixed-variant' },
  expired: { label: 'Expired', cls: 'bg-error-container text-on-error-container' },
  used: { label: 'Used Up', cls: 'bg-surface-container-highest text-on-surface-variant' },
}

export function PackageStatusBadge({ status }: { status: PackageStatus }) {
  const s = PKG_LABEL[status]
  return <span className={cn('rounded-full px-sm py-xs font-label-md text-label-md', s.cls)}>{s.label}</span>
}

/** Badge distinguishing Clinic A vs Clinic B. */
export function ClinicBadge({ clinicId, name }: { clinicId: string; name: string }) {
  const isA = clinicId === 'clinic-a'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-xs rounded-full px-sm py-xs font-label-md text-label-md',
        isA ? 'bg-clinic-a/10 text-clinic-a' : 'bg-clinic-b/10 text-clinic-b',
      )}
    >
      <Icon name="location_on" size={16} />
      {name}
    </span>
  )
}
