import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import type { Therapist } from '../../data/types'

export function AdminTherapists() {
  const therapists = useApp((s) => s.therapists)
  const createTherapist = useApp((s) => s.createTherapist)
  const updateTherapist = useApp((s) => s.updateTherapist)
  const toggleActive = useApp((s) => s.toggleTherapistActive)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Therapist | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setName('')
    setError(null)
    setModal(true)
  }
  function openEdit(t: Therapist) {
    setEditing(t)
    setName(t.name)
    setError(null)
    setModal(true)
  }
  function save() {
    if (editing) {
      const err = updateTherapist(editing.id, name)
      if (err) return setError(err)
      toast.success('Therapist updated.')
    } else {
      const err = createTherapist(name)
      if (err) return setError(err)
      toast.success('Therapist added.')
    }
    setModal(false)
  }

  return (
    <div>
      <PageHeader
        title="Therapists"
        subtitle="Who delivers treatments"
        back
        right={<Button size="sm" onClick={openCreate}><Icon name="add" size={16} /> Add</Button>}
      />
      <div className="space-y-sm p-md">
        {therapists.length === 0 ? (
          <EmptyState icon="person" title="No therapists yet" subtitle="Add the therapists who can be assigned to appointments." />
        ) : (
          therapists.map((t) => (
            <Card key={t.id} className={cn(!t.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-sm">
                <div className="flex min-w-0 items-center gap-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <Icon name="person" size={20} />
                  </div>
                  <p className="min-w-0 truncate font-label-lg text-label-lg text-on-surface">{t.name}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-sm py-xs font-label-md text-label-md',
                    t.active ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {t.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-sm flex gap-sm">
                <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await confirm({
                      title: t.active ? 'Deactivate therapist?' : 'Activate therapist?',
                      message: t.active
                        ? `Deactivate "${t.name}"? They won't be available for new assignments.`
                        : `Activate "${t.name}" so they can be assigned again?`,
                      confirmLabel: t.active ? 'Deactivate' : 'Activate',
                      danger: t.active,
                    })
                    if (!ok) return
                    toggleActive(t.id)
                    toast.success(t.active ? 'Therapist deactivated.' : 'Therapist activated.')
                  }}
                >
                  {t.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Therapist' : 'Add Therapist'}>
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Therapist name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Button size="lg" onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
