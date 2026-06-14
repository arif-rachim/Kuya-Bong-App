import { useParams } from 'react-router-dom'
import { TopBar } from '../../components/TopBar'
import { Card, EmptyState, SectionTitle } from '../../components/ui'
import { PackageStatusBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { PageIntro } from '../../components/PageIntro'
import { useApp } from '../../store/appStore'
import { formatDate } from '../../lib/date'

export function PackageDetails() {
  const { id = '' } = useParams()
  const pkg = useApp((s) => s.patientPackages.find((p) => p.id === id))
  const allUsage = useApp((s) => s.packageUsage)
  const usage = allUsage.filter((u) => u.patientPackageId === id)

  if (!pkg) {
    return (
      <div className="min-h-screen">
        <TopBar title="Package Details" back />
        <EmptyState icon="inventory_2" title="Package not found" />
      </div>
    )
  }

  const used = pkg.totalSessions - pkg.remaining
  const pct = Math.round((pkg.remaining / pkg.totalSessions) * 100)

  return (
    <div className="min-h-screen">
      <TopBar title="Package Details" back />
      <div className="space-y-md px-margin-mobile py-md">
        <PageIntro>
          A breakdown of this package: sessions used vs. remaining, validity dates, and a history of every session —
          including which family member it was for and who recorded it.
        </PageIntro>
        <Card>
          <div className="flex items-start justify-between gap-sm">
            <div className="min-w-0">
              <p className="font-headline-sm text-headline-sm text-on-surface">{pkg.name}</p>
              <div className="mt-xs flex items-center gap-xs text-on-surface-variant">
                <Icon name="calendar_month" size={18} className="text-primary" />
                <p className="text-body-md">Started {formatDate(pkg.assignDate)}</p>
              </div>
              <div className="mt-xs flex items-center gap-xs text-on-surface-variant">
                <Icon name="event_busy" size={18} className="text-primary" />
                <p className="text-body-md">Valid until {formatDate(pkg.expiryDate)}</p>
              </div>
            </div>
            <PackageStatusBadge status={pkg.status} />
          </div>

          <div className="mt-md h-2 overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-md grid grid-cols-3 gap-base text-center">
            <Stat label="Total" value={pkg.totalSessions} />
            <Stat label="Used" value={used} />
            <Stat label="Left" value={pkg.remaining} highlight />
          </div>
        </Card>

        <div>
          <SectionTitle>Usage History</SectionTitle>
          {usage.length === 0 ? (
            <EmptyState
              icon="history"
              title="No usage yet"
              subtitle="Used sessions will appear here after treatment is completed."
            />
          ) : (
            <div className="space-y-sm">
              {usage.map((u) => (
                <Card key={u.id} className="p-sm">
                  <div className="flex items-center justify-between gap-sm">
                    <div className="flex items-center gap-sm">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
                        <Icon name="person" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-lg text-label-lg text-on-surface">{u.memberName}</p>
                        <p className="text-label-md text-on-surface-variant">{formatDate(u.date)}</p>
                      </div>
                    </div>
                    <span className="text-label-md text-on-surface-variant">by {u.recordedBy}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface py-sm">
      <p className={`font-headline-md text-headline-md ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
      <p className="text-label-md uppercase text-on-surface-variant">{label}</p>
    </div>
  )
}
