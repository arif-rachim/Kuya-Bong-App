import { PageHeader } from '../../components/PageHeader'
import { Card, EmptyState } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useApp } from '../../store/appStore'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AdminAuditLog() {
  const auditLog = useApp((s) => s.auditLog)

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Important admin actions" back />
      <div className="space-y-sm p-md">
        {auditLog.length === 0 ? (
          <EmptyState icon="history" title="No activity yet" subtitle="Important Master/Sub-Admin actions will appear here." />
        ) : (
          auditLog.map((e) => (
            <Card key={e.id} className="p-sm">
              <div className="flex items-start gap-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                  <Icon name="receipt_long" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface">{e.action}</p>
                  <p className="text-body-md text-on-surface-variant">{e.detail}</p>
                  <p className="mt-xs font-label-md text-label-md text-on-surface-variant">
                    {e.actorName} · {formatDateTime(e.at)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
