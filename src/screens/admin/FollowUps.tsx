import { PageHeader } from '../../components/PageHeader'
import { Button, Card, EmptyState } from '../../components/ui'
import { toast } from '../../components/Toast'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { formatDate } from '../../lib/date'
import type { FollowUpStatus } from '../../data/types'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { setFollowUpStatusFn } from '../../lib/manggaleh/write'

const NEXT: Record<FollowUpStatus, FollowUpStatus> = {
  NotDue: 'Due',
  Due: 'Contacted',
  Contacted: 'Completed',
  Completed: 'Completed',
}
const LABEL: Record<FollowUpStatus, { text: string; cls: string }> = {
  NotDue: { text: 'Not due', cls: 'bg-surface-container-highest text-on-surface-variant' },
  Due: { text: 'Due', cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  Contacted: { text: 'Contacted', cls: 'bg-secondary-container text-on-secondary-container' },
  Completed: { text: 'Completed', cls: 'bg-primary-fixed text-on-primary-fixed-variant' },
}

export function AdminFollowUps() {
  const purchases = useApp((s) => s.purchases)
  const users = useApp((s) => s.users)
  const setFollowUpStatus = useApp((s) => s.setFollowUpStatus)

  async function advance(purchaseId: string, next: FollowUpStatus) {
    if (isManggalehEnabled()) {
      try {
        await setFollowUpStatusFn(purchaseId, next)
        useApp.setState((s) => ({ purchases: s.purchases.map((p) => (p.id === purchaseId ? { ...p, followUpStatus: next } : p)) }))
        toast.success(`Marked as ${LABEL[next].text}.`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update the follow-up status.')
      }
      return
    }
    setFollowUpStatus(purchaseId, next)
    toast.success(`Marked as ${LABEL[next].text}.`)
  }

  const list = purchases
    .filter((p) => p.followUpStatus !== 'Completed')
    .sort((a, b) => (a.estimatedFollowUpDate ?? '').localeCompare(b.estimatedFollowUpDate ?? ''))

  const patientName = (uid: string) => users.find((u) => u.id === uid)?.name ?? '—'

  return (
    <div>
      <PageHeader title="Follow-up List" subtitle="Patients who may need a refill soon" back />
      <div className="space-y-sm p-md">
        {list.length === 0 ? (
          <EmptyState icon="call" title="No follow-ups" subtitle="All handled." />
        ) : (
          list.map((p) => {
            const lbl = LABEL[p.followUpStatus]
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-sm">
                  <div className="min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface">{patientName(p.patientUserId)}</p>
                    <p className="text-label-md text-on-surface-variant">{p.productName} · bought {formatDate(p.purchaseDate)}</p>
                    {p.estimatedFollowUpDate && (
                      <p className="text-label-md text-on-surface-variant">Est. follow-up: {formatDate(p.estimatedFollowUpDate)}</p>
                    )}
                  </div>
                  <span className={cn('shrink-0 rounded-full px-sm py-xs font-label-md text-label-md', lbl.cls)}>{lbl.text}</span>
                </div>
                {p.followUpStatus !== 'Completed' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-sm"
                    onClick={() => advance(p.id, NEXT[p.followUpStatus])}
                  >
                    Mark as: {LABEL[NEXT[p.followUpStatus]].text}
                  </Button>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
