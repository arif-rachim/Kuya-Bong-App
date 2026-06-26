import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import type { CancellationReason } from '../../data/types'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { createReasonFn, updateReasonFn, setReasonActiveFn } from '../../lib/manggaleh/write'

export function AdminCancellationReasons() {
  const reasons = useApp((s) => s.cancellationReasons)
  const createReason = useApp((s) => s.createCancellationReason)
  const updateReason = useApp((s) => s.updateCancellationReason)
  const toggleActive = useApp((s) => s.toggleCancellationReasonActive)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<CancellationReason | null>(null)
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setLabel('')
    setError(null)
    setModal(true)
  }
  function openEdit(r: CancellationReason) {
    setEditing(r)
    setLabel(r.label)
    setError(null)
    setModal(true)
  }
  async function save() {
    const text = label.trim()
    if (!text) return setError('Reason can\'t be empty.')
    if (isManggalehEnabled()) {
      try {
        if (editing) {
          await updateReasonFn(editing.id, text)
          useApp.setState((s) => ({ cancellationReasons: s.cancellationReasons.map((r) => (r.id === editing.id ? { ...r, label: text } : r)) }))
          toast.success('Reason updated.')
        } else {
          const id = await createReasonFn(text)
          useApp.setState((s) => ({ cancellationReasons: [...s.cancellationReasons, { id, label: text, active: true }] }))
          toast.success('Reason added.')
        }
        setModal(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save the reason.')
      }
      return
    }
    if (editing) {
      const err = updateReason(editing.id, label)
      if (err) return setError(err)
      toast.success('Reason updated.')
    } else {
      const err = createReason(label)
      if (err) return setError(err)
      toast.success('Reason added.')
    }
    setModal(false)
  }

  async function toggle(r: CancellationReason) {
    if (isManggalehEnabled()) {
      try {
        await setReasonActiveFn(r.id, !r.active)
        useApp.setState((s) => ({ cancellationReasons: s.cancellationReasons.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)) }))
        toast.success(r.active ? 'Reason deactivated.' : 'Reason activated.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update the reason.')
      }
      return
    }
    toggleActive(r.id)
    toast.success(r.active ? 'Reason deactivated.' : 'Reason activated.')
  }

  return (
    <div>
      <PageHeader
        title="Cancellation Reasons"
        subtitle="Picked when an appointment is cancelled"
        back
        right={<Button size="sm" onClick={openCreate}><Icon name="add" size={16} /> Add</Button>}
      />
      <div className="space-y-sm p-md">
        {reasons.length === 0 ? (
          <EmptyState icon="cancel" title="No reasons yet" subtitle="Add the cancellation reasons patients can choose from." />
        ) : (
          reasons.map((r) => (
            <Card key={r.id} className={cn(!r.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-sm">
                <p className="min-w-0 font-label-lg text-label-lg text-on-surface">{r.label}</p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-sm py-xs font-label-md text-label-md',
                    r.active ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {r.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-sm flex gap-sm">
                <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await confirm({
                      title: r.active ? 'Deactivate reason?' : 'Activate reason?',
                      message: r.active
                        ? `Deactivate "${r.label}"? It will be hidden from new cancellations but stays on past records.`
                        : `Activate "${r.label}" so it can be chosen again?`,
                      confirmLabel: r.active ? 'Deactivate' : 'Activate',
                      danger: r.active,
                    })
                    if (!ok) return
                    await toggle(r)
                  }}
                >
                  {r.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))
        )}
        <p className="px-xs text-label-md text-on-surface-variant">
          Tip: keep an "Other" reason so patients can explain unlisted situations with a note.
        </p>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Reason' : 'Add Reason'}>
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Reason">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Button size="lg" onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
