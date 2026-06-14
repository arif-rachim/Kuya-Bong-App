import { Link } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { Card, EmptyState } from '../../components/ui'
import { PackageStatusBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { PageIntro } from '../../components/PageIntro'
import { useApp } from '../../store/appStore'
import { useCurrentUser } from '../../store/selectors'
import { formatDate } from '../../lib/date'

export function MyPackages() {
  const user = useCurrentUser()
  const allPackages = useApp((s) => s.patientPackages)
  const packages = allPackages.filter((p) => p.ownerUserId === user?.id)

  return (
    <div>
      <TopBar title="My Packages" />
      <div className="px-margin-mobile pt-md">
        <PageIntro>
          Your prepaid treatment packages. Each card shows sessions remaining and the expiry date — tap one to see its
          full usage history, including which family member used each session. Packages are assigned by the clinic.
        </PageIntro>
      </div>

      <div className="space-y-md px-margin-mobile py-md">
        {packages.length === 0 ? (
          <EmptyState icon="inventory_2" title="No packages yet" subtitle="Packages are assigned by the admin." />
        ) : (
          packages.map((p) => {
            const pct = Math.round((p.remaining / p.totalSessions) * 100)
            return (
              <Link key={p.id} to={`/patient/package/${p.id}`} className="block">
                <Card>
                  <div className="flex items-start justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="font-headline-sm text-headline-sm text-on-surface">{p.name}</p>
                      <div className="mt-xs flex items-center gap-xs text-on-surface-variant">
                        <Icon name="calendar_month" size={18} className="text-primary" />
                        <p className="text-body-md">Valid until {formatDate(p.expiryDate)}</p>
                      </div>
                    </div>
                    <PackageStatusBadge status={p.status} />
                  </div>

                  <div className="mt-md">
                    <div className="flex items-end justify-between">
                      <p className="font-headline-lg text-headline-lg text-primary">{p.remaining}</p>
                      <p className="text-body-md text-on-surface-variant">of {p.totalSessions} sessions</p>
                    </div>
                    <div className="mt-base h-2 overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-md flex items-center justify-end gap-xs font-label-lg text-label-lg text-primary">
                    View usage history <Icon name="chevron_right" size={18} />
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
