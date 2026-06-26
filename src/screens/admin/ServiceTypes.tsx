import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input, Textarea } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import type { ServiceType } from '../../data/types'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { createServiceFn, updateServiceFn, setServiceActiveFn } from '../../lib/manggaleh/write'

/** Format a duration in minutes as a short, human-readable label (e.g. "3h", "2h 30m", "45m"). */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function AdminServiceTypes() {
  const services = useApp((s) => s.services)
  const createService = useApp((s) => s.createService)
  const updateService = useApp((s) => s.updateService)
  const toggleActive = useApp((s) => s.toggleServiceActive)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<ServiceType | null>(null)
  const [form, setForm] = useState<{ name: string; duration: string; notes: string }>({
    name: '', duration: '', notes: '',
  })
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm({ name: '', duration: '', notes: '' })
    setError(null)
    setModal(true)
  }
  function openEdit(sv: ServiceType) {
    setEditing(sv)
    setForm({ name: sv.name, duration: String(sv.durationMinutes), notes: sv.notes ?? '' })
    setError(null)
    setModal(true)
  }
  async function save() {
    const name = form.name.trim()
    const durationMinutes = Number(form.duration)
    const notes = form.notes.trim()
    if (!name) return setError('Service name can\'t be empty.')
    if (!(durationMinutes > 0)) return setError('Duration must be greater than 0.')
    if (isManggalehEnabled()) {
      try {
        if (editing) {
          await updateServiceFn(editing.id, { name, durationMinutes, notes })
          useApp.setState((s) => ({ services: s.services.map((sv) => (sv.id === editing.id ? { ...sv, name, durationMinutes, notes: notes || undefined } : sv)) }))
          toast.success('Service updated.')
        } else {
          const id = await createServiceFn({ name, durationMinutes, notes })
          useApp.setState((s) => ({ services: [...s.services, { id, name, durationMinutes, notes: notes || undefined, active: true }] }))
          toast.success('Service added.')
        }
        setModal(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save the service.')
      }
      return
    }
    if (editing) {
      const err = updateService(editing.id, { name: form.name, durationMinutes, notes: form.notes })
      if (err) return setError(err)
      toast.success('Service updated.')
    } else {
      const err = createService({ name: form.name, durationMinutes, notes: form.notes })
      if (err) return setError(err)
      toast.success('Service added.')
    }
    setModal(false)
  }

  async function toggle(sv: ServiceType) {
    if (isManggalehEnabled()) {
      try {
        await setServiceActiveFn(sv.id, !sv.active)
        useApp.setState((s) => ({ services: s.services.map((x) => (x.id === sv.id ? { ...x, active: !sv.active } : x)) }))
        toast.success(sv.active ? 'Service deactivated.' : 'Service activated.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update the service.')
      }
      return
    }
    toggleActive(sv.id)
    toast.success(sv.active ? 'Service deactivated.' : 'Service activated.')
  }

  return (
    <div>
      <PageHeader
        title="Service Types"
        subtitle="Services & their durations"
        back
        right={<Button size="sm" onClick={openCreate}><Icon name="add" size={16} /> Add</Button>}
      />
      <div className="space-y-sm p-md">
        {services.length === 0 ? (
          <EmptyState icon="medical_services" title="No services yet" subtitle="Add the services Kuya Bong offers." />
        ) : (
          services.map((sv) => (
            <Card key={sv.id} className={cn(!sv.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-sm">
                <div className="min-w-0">
                  <p className="font-label-lg text-label-lg text-on-surface">{sv.name}</p>
                  <p className="text-label-md text-on-surface-variant">
                    <Icon name="schedule" size={14} /> {formatDuration(sv.durationMinutes)} · {sv.durationMinutes} min
                  </p>
                  {sv.notes && <p className="mt-xs text-label-md text-on-surface-variant">{sv.notes}</p>}
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-sm py-xs font-label-md text-label-md',
                    sv.active ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {sv.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-sm flex gap-sm">
                <Button size="sm" variant="secondary" onClick={() => openEdit(sv)}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await confirm({
                      title: sv.active ? 'Deactivate service?' : 'Activate service?',
                      message: sv.active
                        ? `Deactivate "${sv.name}"? It will be hidden from new bookings.`
                        : `Activate "${sv.name}" so it can be booked again?`,
                      confirmLabel: sv.active ? 'Deactivate' : 'Activate',
                      danger: sv.active,
                    })
                    if (!ok) return
                    await toggle(sv)
                  }}
                >
                  {sv.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))
        )}
        <p className="px-xs text-label-md text-on-surface-variant">
          The service duration determines the appointment end time and which start times are offered.
        </p>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Service' : 'Add Service'}>
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Service name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Duration (minutes)" hint="e.g. 180 for a 3-hour service">
            <Input type="number" min={1} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </Field>
          <Field label="Notes (optional)">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <Button size="lg" onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
