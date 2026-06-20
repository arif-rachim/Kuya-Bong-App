import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Select } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'

export function AdminSubAdmins() {
  const users = useApp((s) => s.users)
  const appointSubAdmin = useApp((s) => s.appointSubAdmin)
  const removeSubAdmin = useApp((s) => s.removeSubAdmin)

  const admins = users.filter((u) => u.role === 'admin')
  const patients = users.filter((u) => u.role === 'patient')
  const [pick, setPick] = useState('')

  function appoint() {
    if (!pick) return toast.error('Choose a registered user first.')
    const err = appointSubAdmin(pick)
    if (err) return toast.error(err)
    setPick('')
    toast.success('Sub-admin appointed.')
  }

  return (
    <div>
      <PageHeader title="Sub-Admins" subtitle="Master Admin access control" back />
      <div className="space-y-md p-md">
        <Banner kind="info">
          Sub-admins help with daily operations (bookings, sessions, products, announcements, reports) but can't manage
          core master data (clinics, therapists, services, cancellation reasons) or other sub-admins.
        </Banner>

        <Card className="space-y-sm bg-surface-container-low">
          <Field label="Appoint a registered user as sub-admin">
            <Select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">— Select a patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </Select>
          </Field>
          <Button size="sm" onClick={appoint}><Icon name="add_moderator" size={16} /> Appoint sub-admin</Button>
          {patients.length === 0 && (
            <p className="font-label-md text-label-md text-on-surface-variant">No registered patients to appoint.</p>
          )}
        </Card>

        <div className="space-y-sm">
          {admins.length === 0 ? (
            <EmptyState icon="shield_person" title="No admins" />
          ) : (
            admins.map((a) => {
              const isMaster = a.adminLevel === 'master'
              return (
                <Card key={a.id} className={cn(isMaster && 'border-primary/40')}>
                  <div className="flex items-start justify-between gap-sm">
                    <div className="flex min-w-0 items-center gap-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <Icon name={isMaster ? 'shield_person' : 'badge'} size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-label-lg text-label-lg text-on-surface">{a.name}</p>
                        <p className="truncate text-label-md text-on-surface-variant">{a.email}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-sm py-xs font-label-md text-label-md',
                        isMaster ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container',
                      )}
                    >
                      {isMaster ? 'Master Admin' : 'Sub-Admin'}
                    </span>
                  </div>
                  {!isMaster && (
                    <div className="mt-sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Remove sub-admin?',
                            message: `Remove admin access from ${a.name}? They'll go back to being a regular patient.`,
                            confirmLabel: 'Remove',
                            danger: true,
                          })
                          if (!ok) return
                          const err = removeSubAdmin(a.id)
                          if (err) return toast.error(err)
                          toast.success('Sub-admin removed.')
                        }}
                      >
                        <Icon name="person_remove" size={16} /> Remove access
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
