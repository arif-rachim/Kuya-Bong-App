import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, EmptyState, Field, Input, Select, Textarea } from '../../components/ui'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { confirm } from '../../components/Confirm'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/appStore'
import { formatPrice } from '../../lib/date'
import type { Product, ProductCategory } from '../../data/types'

export function AdminProducts() {
  const products = useApp((s) => s.products)
  const createProduct = useApp((s) => s.createProduct)
  const updateProduct = useApp((s) => s.updateProduct)
  const toggleActive = useApp((s) => s.toggleProductActive)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<{ name: string; category: ProductCategory; price: string; notes: string }>({
    name: '', category: 'herbal', price: '', notes: '',
  })
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm({ name: '', category: 'herbal', price: '', notes: '' })
    setError(null)
    setModal(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, category: p.category, price: String(p.price), notes: p.notes ?? '' })
    setError(null)
    setModal(true)
  }
  function save() {
    const price = Number(form.price)
    if (editing) {
      const err = updateProduct(editing.id, { name: form.name, category: form.category, price, notes: form.notes })
      if (err) return setError(err)
      toast.success('Product updated.')
    } else {
      const err = createProduct({ name: form.name, category: form.category, price, notes: form.notes })
      if (err) return setError(err)
      toast.success('Product added.')
    }
    setModal(false)
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Herbal & supplement catalogue"
        right={<Button size="sm" onClick={openCreate}><Icon name="add" size={16} /> Add</Button>}
      />
      <div className="space-y-sm p-md">
        {products.length === 0 ? (
          <EmptyState icon="medication" title="No products yet" />
        ) : (
          products.map((p) => (
            <Card key={p.id} className={cn(!p.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-sm">
                <div className="min-w-0">
                  <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                  <p className="text-label-md capitalize text-on-surface-variant">{p.category} · {formatPrice(p.price)}</p>
                  {p.notes && <p className="mt-xs text-label-md text-on-surface-variant">{p.notes}</p>}
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-sm py-xs font-label-md text-label-md',
                    p.active ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant',
                  )}
                >
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-sm flex gap-sm">
                <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await confirm({
                      title: p.active ? 'Deactivate product?' : 'Activate product?',
                      message: p.active
                        ? `Deactivate "${p.name}"? It will be hidden from new purchases.`
                        : `Activate "${p.name}" so it can be sold again?`,
                      confirmLabel: p.active ? 'Deactivate' : 'Activate',
                      danger: p.active,
                    })
                    if (!ok) return
                    toggleActive(p.id)
                    toast.success(p.active ? 'Product deactivated.' : 'Product activated.')
                  }}
                >
                  {p.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))
        )}
        <p className="px-xs text-label-md text-on-surface-variant">
          Changing the price does not affect prices on already-recorded purchases.
        </p>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        {error && <div className="mb-sm"><Banner kind="error">{error}</Banner></div>}
        <div className="space-y-sm">
          <Field label="Product name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ProductCategory }))}>
                <option value="herbal">Herbal</option>
                <option value="supplement">Supplement</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Price">
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <Button size="lg" onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
