import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input, Select, SectionTitle } from '../../components/ui'
import { PackageStatusBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { useApp } from '../../store/appStore'
import { formatDate } from '../../lib/date'

export function AdminPackages() {
  const defs = useApp((s) => s.packageDefs)
  const patientPackages = useApp((s) => s.patientPackages)
  const users = useApp((s) => s.users)
  const createDef = useApp((s) => s.createPackageDef)
  const assignPackage = useApp((s) => s.assignPackage)

  const [createModal, setCreateModal] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [form, setForm] = useState({ name: '', sessions: '6', validityDays: '90' })
  const [assign, setAssign] = useState({ userId: '', defId: '' })
  const [error, setError] = useState<string | null>(null)

  const patientName = (uid: string) => users.find((u) => u.id === uid)?.name ?? '—'

  function doCreate() {
    const err = createDef(form.name, Number(form.sessions), Number(form.validityDays))
    if (err) return setError(err)
    setCreateModal(false); setError(null); setForm({ name: '', sessions: '6', validityDays: '90' }); toast.success('Package definition created.')
  }
  function doAssign() {
    if (!assign.userId || !assign.defId) return setError('Complete patient & package.')
    const err = assignPackage(assign.userId, assign.defId)
    if (err) return setError(err)
    setAssignModal(false); setError(null); setAssign({ userId: '', defId: '' }); toast.success('Package assigned.')
  }

  return (
    <div>
      <PageHeader
        title="Packages"
        subtitle="Definitions & assignment"
        right={
          <Button size="sm" onClick={() => { setCreateModal(true); setError(null) }}>
            <Icon name="add" size={16} /> Create
          </Button>
        }
      />
      <div className="space-y-md p-md">
        <section>
          <SectionTitle
            action={
              <Button size="sm" variant="secondary" onClick={() => { setAssignModal(true); setError(null) }}>
                Assign to Patient
              </Button>
            }
          >
            Package Definitions
          </SectionTitle>
          <div className="space-y-sm">
            {defs.map((d) => (
              <Card key={d.id} className="border-l-4 border-l-primary">
                <div className="flex items-start gap-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <Icon name="inventory_2" size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface">{d.name}</p>
                    <p className="text-label-md text-on-surface-variant">{d.sessions} sessions · valid {d.validityDays} days</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Assigned Packages</SectionTitle>
          {patientPackages.length === 0 ? (
            <EmptyState icon="inventory_2" title="No assigned packages yet" />
          ) : (
            <div className="space-y-sm">
              {patientPackages.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-center justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="font-label-lg text-label-lg text-on-surface">{patientName(p.ownerUserId)}</p>
                      <p className="text-label-md text-on-surface-variant">{p.name} · {p.remaining}/{p.totalSessions} left · until {formatDate(p.expiryDate)}</p>
                    </div>
                    <PackageStatusBadge status={p.status} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Package Definition">
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Package name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. 6-Session Package" />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Number of sessions">
              <Input type="number" min={1} value={form.sessions} onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))} />
            </Field>
            <Field label="Validity (days)">
              <Input type="number" min={1} value={form.validityDays} onChange={(e) => setForm((f) => ({ ...f, validityDays: e.target.value }))} />
            </Field>
          </div>
          <Button size="lg" onClick={doCreate}>Save</Button>
        </div>
      </Modal>

      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Package">
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Patient">
            <Select value={assign.userId} onChange={(e) => setAssign((a) => ({ ...a, userId: e.target.value }))}>
              <option value="">— Select —</option>
              {users.filter((u) => u.role === 'patient').map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Package">
            <Select value={assign.defId} onChange={(e) => setAssign((a) => ({ ...a, defId: e.target.value }))}>
              <option value="">— Select —</option>
              {defs.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Button size="lg" onClick={doAssign}>Assign</Button>
        </div>
      </Modal>
    </div>
  )
}
