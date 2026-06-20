import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input, Textarea } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { addDays, formatDate, todayISO } from '../../lib/date'
import type { Announcement } from '../../data/types'

function statusOf(a: Announcement): { label: string; cls: string } {
  if (!a.published) return { label: 'Unpublished', cls: 'bg-surface-container-highest text-on-surface-variant' }
  if (a.expiryDate < todayISO()) return { label: 'Expired', cls: 'bg-surface-container-highest text-on-surface-variant' }
  return { label: 'Active', cls: 'bg-primary-fixed text-on-primary-fixed-variant' }
}

export function AdminAnnouncements() {
  const announcements = useApp((s) => s.announcements)
  const createAnnouncement = useApp((s) => s.createAnnouncement)
  const unpublish = useApp((s) => s.unpublishAnnouncement)
  const remove = useApp((s) => s.deleteAnnouncement)

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', expiryDate: addDays(todayISO(), 7) })
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setForm({ title: '', message: '', expiryDate: addDays(todayISO(), 7) })
    setError(null)
    setModal(true)
  }
  function save() {
    const err = createAnnouncement(form)
    if (err) return setError(err)
    toast.success('Announcement published.')
    setModal(false)
  }

  const sorted = [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Push notices to customers"
        back
        right={<Button size="sm" onClick={openCreate}><Icon name="add" size={16} /> New</Button>}
      />
      <div className="space-y-sm p-md">
        <Banner kind="info">
          Published announcements show in the customer app until their expiry date. Pull one early to hide it; history is kept here.
        </Banner>
        {sorted.length === 0 ? (
          <EmptyState icon="campaign" title="No announcements yet" subtitle="Create your first announcement." />
        ) : (
          sorted.map((a) => {
            const st = statusOf(a)
            return (
              <Card key={a.id} className={cn(st.label !== 'Active' && 'opacity-70')}>
                <div className="flex items-start justify-between gap-sm">
                  <div className="min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface">{a.title}</p>
                    <p className="mt-xs text-body-md text-on-surface-variant">{a.message}</p>
                    <p className="mt-xs font-label-md text-label-md text-on-surface-variant">
                      Sent {formatDate(a.createdAt)} · expires {formatDate(a.expiryDate)}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-sm py-xs font-label-md text-label-md', st.cls)}>{st.label}</span>
                </div>
                <div className="mt-sm flex gap-sm">
                  {a.published && a.expiryDate >= todayISO() && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Pull announcement?',
                          message: `Hide "${a.title}" from customers now?`,
                          confirmLabel: 'Pull',
                          danger: true,
                        })
                        if (!ok) return
                        unpublish(a.id)
                        toast.success('Announcement pulled.')
                      }}
                    >
                      <Icon name="visibility_off" size={16} /> Pull
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Delete announcement?',
                        message: `Permanently delete "${a.title}" from history?`,
                        confirmLabel: 'Delete',
                        danger: true,
                      })
                      if (!ok) return
                      remove(a.id)
                      toast.success('Announcement deleted.')
                    }}
                  >
                    <Icon name="delete" size={16} /> Delete
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Announcement">
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Buy one get one free" />
          </Field>
          <Field label="Message">
            <Textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </Field>
          <Field label="Expiry date" hint="The announcement auto-hides after this date.">
            <Input type="date" value={form.expiryDate} min={todayISO()} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
          </Field>
          <Button size="lg" onClick={save}><Icon name="campaign" size={18} /> Publish & push</Button>
        </div>
      </Modal>
    </div>
  )
}
