import { PageHeader } from '../../components/PageHeader'
import { Button, Card, EmptyState } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { formatDate } from '../../lib/date'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function AdminCreditTransfers() {
  const transfers = useApp((s) => s.creditTransfers)
  const users = useApp((s) => s.users)
  const reverseTransfer = useApp((s) => s.reverseTransfer)
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'

  return (
    <div>
      <PageHeader title="Credit Transfers" subtitle="Friend package-credit transfers" back />
      <div className="space-y-sm p-md">
        {transfers.length === 0 ? (
          <EmptyState icon="swap_horiz" title="No transfers yet" subtitle="Friend credit transfers will appear here." />
        ) : (
          transfers.map((t) => (
            <Card key={t.id} className={cn(t.reversed && 'opacity-60')}>
              <div className="flex items-start justify-between gap-sm">
                <div className="min-w-0">
                  <p className="font-label-lg text-label-lg text-on-surface">
                    {userName(t.fromUserId)} <Icon name="arrow_forward" size={14} /> {userName(t.toUserId)}
                  </p>
                  <p className="text-label-md text-on-surface-variant">
                    {t.sessions} session(s) · expiry {formatDate(t.expiryDate)} · {formatDateTime(t.at)}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-sm py-xs font-label-md text-label-md',
                    t.reversed ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary-fixed text-on-primary-fixed-variant',
                  )}
                >
                  {t.reversed ? 'Reversed' : 'Active'}
                </span>
              </div>
              {!t.reversed && (
                <div className="mt-sm">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Reverse transfer?',
                        message: `Return ${t.sessions} session(s) to ${userName(t.fromUserId)}? Only works if ${userName(t.toUserId)} hasn't used them.`,
                        confirmLabel: 'Reverse',
                        danger: true,
                      })
                      if (!ok) return
                      const err = reverseTransfer(t.id)
                      if (err) return toast.error(err)
                      toast.success('Transfer reversed.')
                    }}
                  >
                    <Icon name="undo" size={16} /> Reverse
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
