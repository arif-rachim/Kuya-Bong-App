import { TopBar } from '../../components/TopBar'
import { Card, EmptyState } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { PageIntro } from '../../components/PageIntro'
import { useApp } from '../../store/appStore'
import { formatDate, todayISO } from '../../lib/date'

export function PatientAnnouncements() {
  const announcements = useApp((s) => s.announcements)
  const active = announcements
    .filter((a) => a.published && a.expiryDate >= todayISO())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="min-h-screen">
      <TopBar title="Announcements" back />
      <div className="space-y-md px-margin-mobile py-md">
        <PageIntro>News and notices from Kuya Bong — promotions, clinic updates, and schedule changes.</PageIntro>
        {active.length === 0 ? (
          <EmptyState icon="campaign" title="No announcements" subtitle="You're all caught up." />
        ) : (
          active.map((a) => (
            <Card key={a.id} className="space-y-xs">
              <div className="flex items-center gap-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <Icon name="campaign" size={18} />
                </div>
                <p className="min-w-0 flex-1 font-label-lg text-label-lg text-on-surface">{a.title}</p>
              </div>
              <p className="text-body-md text-on-surface-variant">{a.message}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">{formatDate(a.createdAt)}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
