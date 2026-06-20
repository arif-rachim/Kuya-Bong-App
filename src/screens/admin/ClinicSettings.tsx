import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import type { Clinic } from '../../data/types'

export function ClinicSettings() {
  const clinics = useApp((s) => s.clinics)
  const createClinic = useApp((s) => s.createClinic)
  const updateClinic = useApp((s) => s.updateClinic)
  const toggleActive = useApp((s) => s.toggleClinicActive)
  const deleteClinic = useApp((s) => s.deleteClinic)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Clinic | null>(null)
  const [form, setForm] = useState({ name: '', address: '' })
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm({ name: '', address: '' })
    setError(null)
    setModal(true)
  }
  function openEdit(c: Clinic) {
    setEditing(c)
    setForm({ name: c.name, address: c.address })
    setError(null)
    setModal(true)
  }
  function save() {
    if (editing) {
      const err = updateClinic(editing.id, form)
      if (err) return setError(err)
      toast.success('Clinic updated.')
    } else {
      const err = createClinic(form)
      if (err) return setError(err)
      toast.success('Clinic added.')
    }
    setModal(false)
  }

  return (
    <div>
      <PageHeader
        title="Clinic Settings"
        subtitle="Manage clinics"
        back
        right={<Button size="sm" onClick={openCreate}><Icon name="add" size={16} /> Add</Button>}
      />
      <div className="space-y-sm p-md">
        {clinics.length === 0 ? (
          <EmptyState icon="apartment" title="No clinics yet" subtitle="Add your first clinic." />
        ) : (
          clinics.map((c) => (
            <Card key={c.id} accent={c.id === 'clinic-a' ? 'a' : c.id === 'clinic-b' ? 'b' : undefined} className={cn(!c.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-sm">
                <div className="min-w-0">
                  <p className="font-label-lg text-label-lg text-on-surface">{c.name}</p>
                  <p className="text-label-md text-on-surface-variant">{c.address || 'No address'}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-sm py-xs font-label-md text-label-md',
                    c.active ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {c.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-sm flex flex-wrap gap-sm">
                <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await confirm({
                      title: c.active ? 'Deactivate clinic?' : 'Activate clinic?',
                      message: c.active
                        ? `Deactivate "${c.name}"? It will be hidden from new bookings; existing records stay intact.`
                        : `Activate "${c.name}" so it can be booked again?`,
                      confirmLabel: c.active ? 'Deactivate' : 'Activate',
                      danger: c.active,
                    })
                    if (!ok) return
                    toggleActive(c.id)
                    toast.success(c.active ? 'Clinic deactivated.' : 'Clinic activated.')
                  }}
                >
                  {c.active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Delete clinic?',
                      message: `Permanently delete "${c.name}"? This only works if nothing is linked to it.`,
                      confirmLabel: 'Delete',
                      danger: true,
                    })
                    if (!ok) return
                    const err = deleteClinic(c.id)
                    if (err) return toast.error(err)
                    toast.success('Clinic deleted.')
                  }}
                >
                  <Icon name="delete" size={16} /> Delete
                </Button>
              </div>
            </Card>
          ))
        )}
        <p className="px-xs text-label-md text-on-surface-variant">
          Clinics with appointments or availability can't be deleted — deactivate them instead to protect history.
        </p>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Clinic' : 'Add Clinic'}>
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Clinic name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </Field>
          <Button size="lg" onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
