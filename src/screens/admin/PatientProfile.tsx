import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input, Select } from '../../components/ui'
import { AppointmentStatusBadge, ClinicBadge, PackageStatusBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { useApp } from '../../store/appStore'
import { useIsMaster } from '../../store/selectors'
import { formatDate, formatPrice } from '../../lib/date'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { assignPackageFn, updatePackageRemainingFn, deletePackageFn, recordPurchaseFn } from '../../lib/manggaleh/write'
import type { PatientPackage, PackageStatus, ProductPurchase } from '../../data/types'

export function AdminPatientProfile() {
  const { id = '' } = useParams()
  const user = useApp((s) => s.users.find((u) => u.id === id))
  const profile = useApp((s) => s.profiles.find((p) => p.userId === id))
  const allFamily = useApp((s) => s.family)
  const allAppointments = useApp((s) => s.appointments)
  const allPackages = useApp((s) => s.patientPackages)
  const allPurchases = useApp((s) => s.purchases)
  const clinics = useApp((s) => s.clinics)
  const packageDefs = useApp((s) => s.packageDefs)
  const products = useApp((s) => s.products)

  const family = allFamily.filter((m) => m.familyGroupId === profile?.familyGroupId)
  const appointments = allAppointments.filter((a) => a.patientUserId === id)
  const packages = allPackages.filter((p) => p.ownerUserId === id)
  const purchases = allPurchases.filter((p) => p.patientUserId === id)
  const assignPackage = useApp((s) => s.assignPackage)
  const recordPurchase = useApp((s) => s.recordPurchase)
  const deactivateUser = useApp((s) => s.deactivateUser)
  const reactivateUser = useApp((s) => s.reactivateUser)
  const updatePatientPackageRemaining = useApp((s) => s.updatePatientPackageRemaining)
  const removePatientPackage = useApp((s) => s.removePatientPackage)
  const actor = useApp((s) => s.users.find((u) => u.id === s.currentUserId))
  const isMaster = useIsMaster()

  const [modal, setModal] = useState<'pkg' | 'buy' | null>(null)
  const [defId, setDefId] = useState('')
  const [initRemaining, setInitRemaining] = useState('')
  const [editPkg, setEditPkg] = useState<{ id: string; name: string; total: number; value: string } | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [buy, setBuy] = useState({ productId: '', quantity: '1', followUpDays: '30' })
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <div>
        <PageHeader title="Patient Profile" back />
        <EmptyState icon="person_off" title="Patient not found" />
      </div>
    )
  }

  const clinicName = (cid: string) => clinics.find((c) => c.id === cid)?.name ?? ''

  function resetAssign() {
    setModal(null); setError(null); setDefId(''); setInitRemaining('')
  }

  async function doAssign() {
    if (!defId) return setError('Select a package definition.')
    const def = packageDefs.find((d) => d.id === defId)
    if (!def) return setError('Package definition not found.')
    const remaining = initRemaining.trim() === '' ? undefined : Number(initRemaining)
    if (isManggalehEnabled()) {
      const initial = remaining ?? def.sessions
      try {
        const r = await assignPackageFn({
          patientUserId: id, definitionId: def.id, name: def.name, totalSessions: def.sessions,
          remaining: initial, validityDays: def.validityDays, actorUserId: actor?.id, actorName: actor?.name, ownerName: user?.name,
        })
        const pp: PatientPackage = {
          id: r.id, definitionId: def.id, name: def.name, ownerUserId: id, totalSessions: def.sessions,
          remaining: initial, assignDate: r.assignDate, expiryDate: r.expiryDate, status: r.status as PackageStatus,
        }
        useApp.setState((s) => ({ patientPackages: [...s.patientPackages, pp] }))
        resetAssign(); toast.success('Package assigned successfully.')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not assign the package.')
      }
      return
    }
    const err = assignPackage(id, defId, remaining)
    if (err) return setError(err)
    resetAssign(); toast.success('Package assigned successfully.')
  }

  async function saveEditRemaining() {
    if (!editPkg) return
    const remaining = Number(editPkg.value)
    if (isManggalehEnabled()) {
      try {
        const r = await updatePackageRemainingFn({ packageId: editPkg.id, remaining, name: editPkg.name, actorUserId: actor?.id, actorName: actor?.name })
        const pkgId = editPkg.id
        useApp.setState((s) => ({
          patientPackages: s.patientPackages.map((p) => (p.id === pkgId ? { ...p, remaining, status: r.status as PackageStatus } : p)),
        }))
        setEditPkg(null); setEditError(null); toast.success('Remaining sessions updated.')
      } catch (e) {
        setEditError(e instanceof Error ? e.message : 'Could not update the package.')
      }
      return
    }
    const err = updatePatientPackageRemaining(editPkg.id, remaining)
    if (err) return setEditError(err)
    setEditPkg(null); setEditError(null); toast.success('Remaining sessions updated.')
  }
  async function deletePackage(pkgId: string, name: string) {
    const ok = await confirm({
      title: 'Pull back package?',
      message: `Delete the assigned "${name}" subscription? Use this only for a wrongly assigned package. This is logged.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    if (isManggalehEnabled()) {
      try {
        await deletePackageFn({ packageId: pkgId, name, actorUserId: actor?.id, actorName: actor?.name })
        useApp.setState((s) => ({
          patientPackages: s.patientPackages.filter((p) => p.id !== pkgId),
          packageUsage: s.packageUsage.filter((u) => u.patientPackageId !== pkgId),
        }))
        toast.success('Assigned package removed.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not delete the package.')
      }
      return
    }
    const err = removePatientPackage(pkgId)
    if (err) return toast.error(err)
    toast.success('Assigned package removed.')
  }

  function resetBuy() {
    setModal(null); setError(null); setBuy({ productId: '', quantity: '1', followUpDays: '30' })
  }

  async function doBuy() {
    if (!buy.productId) return setError('Select a product.')
    const quantity = Number(buy.quantity) || 1
    const followUpDays = Number(buy.followUpDays) || undefined
    if (isManggalehEnabled()) {
      try {
        const r = await recordPurchaseFn({
          patientUserId: id, productId: buy.productId, quantity, followUpDays,
          actorUserId: actor?.id, actorName: actor?.name, ownerName: user?.name,
        })
        const purchase: ProductPurchase = {
          id: r.id, patientUserId: id, productId: buy.productId, productName: r.productName,
          unitPriceAtSale: r.unitPriceAtSale, quantity, purchaseDate: r.purchaseDate,
          estimatedFollowUpDate: r.estimatedFollowUpDate ?? undefined, followUpStatus: 'NotDue',
        }
        useApp.setState((s) => ({ purchases: [...s.purchases, purchase] }))
        resetBuy(); toast.success('Purchase recorded.')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not record the purchase.')
      }
      return
    }
    const err = recordPurchase({ patientUserId: id, productId: buy.productId, quantity, followUpDays })
    if (err) return setError(err)
    resetBuy(); toast.success('Purchase recorded.')
  }

  return (
    <div>
      <PageHeader title={user.name} subtitle={`${user.email} · ${user.mobile}`} back />
      <div className="space-y-md p-md">
        {/* Identity card */}
        <Card className="flex items-center gap-md">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="person" size={32} fill />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-headline-sm text-headline-sm text-on-surface">{user.name}</p>
            <p className="flex items-center gap-xs truncate text-label-md text-on-surface-variant">
              <Icon name="call" size={16} /> {user.mobile}
            </p>
            <p className="flex items-center gap-xs truncate text-label-md text-on-surface-variant">
              <Icon name="mail" size={16} /> {user.email}
            </p>
          </div>
          {user.active === false && (
            <span className="shrink-0 self-start rounded-full bg-error-container px-sm py-xs font-label-md text-label-md text-on-error-container">
              Deactivated
            </span>
          )}
        </Card>

        {isMaster && (
          user.active === false ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={async () => {
                const ok = await confirm({ title: 'Reactivate user?', message: `Restore access for ${user.name}?`, confirmLabel: 'Reactivate' })
                if (!ok) return
                const err = reactivateUser(id)
                if (err) return toast.error(err)
                toast.success('User reactivated.')
              }}
            >
              <Icon name="person_check" size={18} /> Reactivate User
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              className="w-full"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Deactivate user?',
                  message: `${user.name} won't be able to log in or book, but all their history is kept.`,
                  confirmLabel: 'Deactivate',
                  danger: true,
                })
                if (!ok) return
                const err = deactivateUser(id)
                if (err) return toast.error(err)
                toast.success('User deactivated.')
              }}
            >
              <Icon name="person_off" size={18} /> Deactivate User
            </Button>
          )
        )}

        <div className="grid grid-cols-2 gap-sm">
          <Button size="sm" variant="secondary" className="text-center" onClick={() => { setModal('pkg'); setError(null) }}>
            <Icon name="inventory_2" size={18} /> Assign Package
          </Button>
          <Button size="sm" variant="secondary" className="text-center" onClick={() => { setModal('buy'); setError(null) }}>
            <Icon name="shopping_bag" size={18} /> Record Purchase
          </Button>
        </div>

        <Section title="Details">
          <Card className="space-y-xs">
            <Row label="Verification" value={user.verification === 'verified' ? 'Verified' : 'Not verified'} />
            {profile?.dateOfBirth && <Row label="Date of birth" value={profile.dateOfBirth} />}
            {profile?.address && <Row label="Address" value={profile.address} />}
            {profile?.emergencyContact && <Row label="Emergency contact" value={profile.emergencyContact} />}
          </Card>
        </Section>

        <Section title="Family">
          {family.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No family members.</p>
          ) : (
            <Card className="space-y-xs">
              {family.map((m) => (
                <Row key={m.id} label={m.name} value={m.isChild ? 'Child' : m.status === 'pending' ? 'Pending' : 'Family'} />
              ))}
            </Card>
          )}
        </Section>

        <Section title="Packages">
          {packages.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No packages.</p>
          ) : (
            <div className="space-y-sm">
              {packages.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-center justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                      <p className="text-label-md text-on-surface-variant">{p.remaining}/{p.totalSessions} left · until {formatDate(p.expiryDate)}</p>
                    </div>
                    <PackageStatusBadge status={p.status} />
                  </div>
                  <div className="mt-sm flex gap-sm">
                    <Button size="sm" variant="secondary" onClick={() => { setEditError(null); setEditPkg({ id: p.id, name: p.name, total: p.totalSessions, value: String(p.remaining) }) }}>
                      <Icon name="edit" size={16} /> Edit remaining
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePackage(p.id, p.name)}>
                      <Icon name="delete" size={16} /> Pull back
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>

        <Section title="Appointment History">
          {appointments.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No appointments yet.</p>
          ) : (
            <div className="space-y-sm">
              {appointments
                .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
                .map((a) => (
                  <Card key={a.id}>
                    <div className="flex items-center justify-between gap-sm">
                      <div className="min-w-0">
                        <p className="font-label-lg text-label-lg text-on-surface">{formatDate(a.date)} · {a.start}</p>
                        <div className="mt-xs"><ClinicBadge clinicId={a.clinicId} name={clinicName(a.clinicId)} /></div>
                      </div>
                      <AppointmentStatusBadge status={a.status} />
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </Section>

        <Section title="Product Purchase History">
          {purchases.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No purchases yet.</p>
          ) : (
            <div className="space-y-sm">
              {purchases.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-center justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="font-label-lg text-label-lg text-on-surface">{p.productName} × {p.quantity}</p>
                      <p className="text-label-md text-on-surface-variant">{formatDate(p.purchaseDate)}</p>
                    </div>
                    <p className="font-label-lg text-label-lg text-on-surface">{formatPrice(p.unitPriceAtSale * p.quantity)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Assign package modal */}
      <Modal open={modal === 'pkg'} onClose={() => setModal(null)} title="Assign Package">
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Package definition">
            <Select
              value={defId}
              onChange={(e) => {
                setDefId(e.target.value)
                const d = packageDefs.find((x) => x.id === e.target.value)
                setInitRemaining(d ? String(d.sessions) : '')
              }}
            >
              <option value="">— Select —</option>
              {packageDefs.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.sessions} sessions, {d.validityDays} days)</option>
              ))}
            </Select>
          </Field>
          <Field label="Remaining sessions" hint="Defaults to the package total. Lower it to initialize an existing/offline package.">
            <Input type="number" min={0} value={initRemaining} onChange={(e) => setInitRemaining(e.target.value)} />
          </Field>
          <Button size="lg" onClick={doAssign}>Assign</Button>
        </div>
      </Modal>

      {/* Edit remaining sessions modal (v0.8 correction) */}
      <Modal open={!!editPkg} onClose={() => setEditPkg(null)} title="Edit Remaining Sessions">
        {editError && <div className="mb-sm"><Banner kind="error">{editError}</Banner></div>}
        {editPkg && (
          <div className="space-y-sm">
            <p className="text-body-md text-on-surface-variant">{editPkg.name} · max {editPkg.total}</p>
            <Field label="Remaining sessions">
              <Input
                type="number"
                min={0}
                max={editPkg.total}
                value={editPkg.value}
                onChange={(e) => setEditPkg((s) => (s ? { ...s, value: e.target.value } : s))}
              />
            </Field>
            <Button size="lg" onClick={saveEditRemaining}>Save</Button>
          </div>
        )}
      </Modal>

      {/* Record purchase modal */}
      <Modal open={modal === 'buy'} onClose={() => setModal(null)} title="Record Product Purchase">
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Product" hint="Only active products can be sold.">
            <Select value={buy.productId} onChange={(e) => setBuy((b) => ({ ...b, productId: e.target.value }))}>
              <option value="">— Select —</option>
              {products.filter((p) => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price)}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Quantity">
              <Input type="number" min={1} value={buy.quantity} onChange={(e) => setBuy((b) => ({ ...b, quantity: e.target.value }))} />
            </Field>
            <Field label="Follow-up (days)">
              <Input type="number" min={0} value={buy.followUpDays} onChange={(e) => setBuy((b) => ({ ...b, followUpDays: e.target.value }))} />
            </Field>
          </div>
          <Button size="lg" onClick={doBuy}>Record Purchase</Button>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-sm font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      {children}
    </section>
  )
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-sm py-xs">
      <span className="text-body-md text-on-surface-variant">{label}</span>
      <span className="text-right font-label-lg text-label-lg text-on-surface">{value}</span>
    </div>
  )
}
