import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Card, EmptyState, Field, Select } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useApp } from '../../store/appStore'
import { formatDate, formatPrice, todayISO } from '../../lib/date'

export function AdminHouseholdReport() {
  const users = useApp((s) => s.users)
  const profiles = useApp((s) => s.profiles)
  const family = useApp((s) => s.family)
  const patientPackages = useApp((s) => s.patientPackages)
  const packageUsage = useApp((s) => s.packageUsage)
  const purchases = useApp((s) => s.purchases)
  const transfers = useApp((s) => s.creditTransfers)

  const patients = users.filter((u) => u.role === 'patient')
  const [ownerId, setOwnerId] = useState(patients[0]?.id ?? '')

  const owner = users.find((u) => u.id === ownerId)
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'

  const data = useMemo(() => {
    if (!owner) return null
    const profile = profiles.find((p) => p.userId === owner.id)
    const members = profile ? family.filter((m) => m.familyGroupId === profile.familyGroupId && m.status === 'active') : []
    const ownerPurchases = purchases.filter((p) => p.patientUserId === owner.id)
    const totalSpending = ownerPurchases.reduce((sum, p) => sum + p.unitPriceAtSale * p.quantity, 0)
    const packages = patientPackages.filter((p) => p.ownerUserId === owner.id)
    const usageByPackage = (pkgId: string) => packageUsage.filter((u) => u.patientPackageId === pkgId)
    const ownerTransfers = transfers.filter((t) => t.fromUserId === owner.id || t.toUserId === owner.id)
    return { members, totalSpending, packages, usageByPackage, ownerTransfers }
  }, [owner, profiles, family, purchases, patientPackages, packageUsage, transfers])

  return (
    <div>
      <PageHeader title="Household Report" subtitle="Spending & active packages" back />
      <div className="space-y-md p-md">
        <Card className="bg-surface-container-low">
          <Field label="Household (patient account)">
            <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </Select>
          </Field>
        </Card>

        {!owner || !data ? (
          <EmptyState icon="diversity_3" title="Select a household" />
        ) : (
          <>
            <Card className="space-y-xs">
              <p className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Members</p>
              <p className="font-label-lg text-label-lg text-on-surface">
                <Icon name="person" size={16} /> {owner.name} <span className="text-on-surface-variant">(account owner)</span>
              </p>
              {data.members.map((m) => (
                <p key={m.id} className="font-label-md text-label-md text-on-surface-variant">
                  <Icon name="group" size={14} /> {m.name} · {m.isChild ? 'child' : m.relationship}
                </p>
              ))}
            </Card>

            <Card className="flex items-center justify-between bg-primary-fixed">
              <div>
                <p className="font-label-md text-label-md text-on-primary-fixed-variant">Total spending (products)</p>
                <p className="font-headline-md text-headline-md text-on-primary-fixed">{formatPrice(data.totalSpending)}</p>
              </div>
              <Icon name="payments" size={28} className="text-on-primary-fixed-variant" />
            </Card>

            <div>
              <p className="mb-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Packages</p>
              {data.packages.length === 0 ? (
                <Banner kind="info">No packages for this household.</Banner>
              ) : (
                <div className="space-y-sm">
                  {data.packages.map((p) => {
                    const used = data.usageByPackage(p.id)
                    return (
                      <Card key={p.id}>
                        <div className="flex items-start justify-between gap-sm">
                          <div className="min-w-0">
                            <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                            <p className="text-label-md text-on-surface-variant">
                              {p.assignDate} → {formatDate(p.expiryDate)} · {p.totalSessions} total · {p.totalSessions - p.remaining} used · {p.remaining} left
                            </p>
                          </div>
                          <span className={p.expiryDate < todayISO() ? 'shrink-0 rounded-full bg-error-container px-sm py-xs font-label-md text-label-md text-on-error-container' : 'shrink-0 rounded-full bg-primary-fixed px-sm py-xs font-label-md text-label-md text-on-primary-fixed-variant'}>
                            {p.expiryDate < todayISO() ? 'Expired' : 'Active'}
                          </span>
                        </div>
                        {used.length > 0 && (
                          <div className="mt-sm border-t border-outline-variant/30 pt-sm">
                            <p className="mb-xs font-label-md text-label-md text-on-surface-variant">Sessions used by</p>
                            {used.map((u) => (
                              <p key={u.id} className="font-label-md text-label-md text-on-surface">· {u.memberName} — {formatDate(u.date)}</p>
                            ))}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {data.ownerTransfers.length > 0 && (
              <div>
                <p className="mb-sm font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Friend credit transfers</p>
                <div className="space-y-sm">
                  {data.ownerTransfers.map((t) => (
                    <Card key={t.id} className="p-sm">
                      <p className="font-label-md text-label-md text-on-surface">
                        {t.fromUserId === owner.id ? 'Sent' : 'Received'} {t.sessions} session(s)
                        {t.fromUserId === owner.id ? ` to ${userName(t.toUserId)}` : ` from ${userName(t.fromUserId)}`}
                        {t.reversed ? ' (reversed)' : ''}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <p className="px-xs text-label-md text-on-surface-variant">Friends are not household members; only their credit-transfer records are shown.</p>
          </>
        )}
      </div>
    </div>
  )
}
