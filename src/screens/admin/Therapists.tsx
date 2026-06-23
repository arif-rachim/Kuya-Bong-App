import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input, Select } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import type { Therapist } from '../../data/types'

export function AdminTherapists() {
  const therapists = useApp((s) => s.therapists)
  const users = useApp((s) => s.users)
  const createTherapist = useApp((s) => s.createTherapist)
  const updateTherapist = useApp((s) => s.updateTherapist)
  const toggleActive = useApp((s) => s.toggleTherapistActive)
  const appointPhysiotherapist = useApp((s) => s.appointPhysiotherapist)
  const removePhysiotherapist = useApp((s) => s.removePhysiotherapist)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Therapist | null>(null)
  const [name, setName] = useState('')
  const [pick, setPick] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Registered users not already an active physiotherapist (and not the master admin).
  const appointable = users.filter(
    (u) => u.adminLevel !== 'master' && u.active !== false && !therapists.some((t) => t.userId === u.id && t.active),
  )

  function appoint() {
    if (!pick) return toast.error('Choose a registered user first.')
    const err = appointPhysiotherapist(pick)
    if (err) return toast.error(err)
    setPick('')
    toast.success('Physiotherapist appointed.')
  }

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
        title="Physiotherapists"
        subtitle="Who delivers treatments"
        back
        right={<Button size="sm" onClick={openCreate}><Icon name="add" size={16} /> Add</Button>}
      />
      <div className="space-y-sm p-md">
        <Card className="space-y-sm bg-surface-container-low">
          <Field label="Appoint a registered user as physiotherapist" hint="They can log in and manage only their own appointments.">
            <Select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">— Select a user —</option>
              {appointable.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </Select>
          </Field>
          <Button size="sm" onClick={appoint}><Icon name="badge" size={16} /> Appoint physiotherapist</Button>
        </Card>

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
                  <div className="min-w-0">
                    <p className="min-w-0 truncate font-label-lg text-label-lg text-on-surface">{t.name}</p>
                    {t.userId && (
                      <p className="font-label-md text-label-md text-primary">
                        <Icon name="login" size={13} /> Login enabled
                      </p>
                    )}
                  </div>
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
                {t.userId && t.active && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Remove physiotherapist role?',
                        message: `Remove the physiotherapist role from "${t.name}"? They keep their account but lose schedule access.`,
                        confirmLabel: 'Remove role',
                        danger: true,
                      })
                      if (!ok) return
                      const err = removePhysiotherapist(t.id)
                      if (err) return toast.error(err)
                      toast.success('Physiotherapist role removed.')
                    }}
                  >
                    Remove role
                  </Button>
                )}
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
