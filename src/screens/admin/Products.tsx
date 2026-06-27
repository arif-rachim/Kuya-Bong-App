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
import { compressImage } from '../../lib/image'
import type { Product, ProductCategory } from '../../data/types'
import { isManggalehEnabled } from '../../lib/manggaleh/client'
import { createProductFn, updateProductFn, setProductActiveFn } from '../../lib/manggaleh/write'
import { uploadDataUrl } from '../../lib/manggaleh/storage'
import { StoredImage } from '../../components/StoredImage'

export function AdminProducts() {
  const products = useApp((s) => s.products)
  const createProduct = useApp((s) => s.createProduct)
  const updateProduct = useApp((s) => s.updateProduct)
  const toggleActive = useApp((s) => s.toggleProductActive)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<{ name: string; category: ProductCategory; price: string; notes: string; images: string[] }>({
    name: '', category: 'herbal', price: '', notes: '', images: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm({ name: '', category: 'herbal', price: '', notes: '', images: [] })
    setError(null)
    setModal(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, category: p.category, price: String(p.price), notes: p.notes ?? '', images: p.images ?? [] })
    setError(null)
    setModal(true)
  }
  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const next: string[] = []
      for (const file of Array.from(files)) {
        const dataUrl = await compressImage(file)
        // manggaleh: upload to object storage and keep the id; mock: keep base64
        next.push(isManggalehEnabled() ? await uploadDataUrl(dataUrl) : dataUrl)
      }
      setForm((f) => ({ ...f, images: [...f.images, ...next].slice(0, 5) }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add photo.')
    } finally {
      setUploading(false)
    }
  }
  function removePhoto(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }
  async function save() {
    const name = form.name.trim()
    const price = Number(form.price)
    const notes = form.notes.trim()
    if (!name) return setError('Product name can\'t be empty.')
    if (!(price >= 0)) return setError('Price must be 0 or more.')
    if (isManggalehEnabled()) {
      try {
        if (editing) {
          await updateProductFn(editing.id, { name, category: form.category, price, notes, images: form.images })
          useApp.setState((s) => ({ products: s.products.map((p) => (p.id === editing.id ? { ...p, name, category: form.category, price, notes: notes || undefined, images: form.images } : p)) }))
          toast.success('Product updated.')
        } else {
          const id = await createProductFn({ name, category: form.category, price, notes, images: form.images })
          useApp.setState((s) => ({ products: [...s.products, { id, name, category: form.category, price, notes: notes || undefined, images: form.images, active: true }] }))
          toast.success('Product added.')
        }
        setModal(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save the product.')
      }
      return
    }
    if (editing) {
      const err = updateProduct(editing.id, { name: form.name, category: form.category, price, notes: form.notes, images: form.images })
      if (err) return setError(err)
      toast.success('Product updated.')
    } else {
      const err = createProduct({ name: form.name, category: form.category, price, notes: form.notes, images: form.images })
      if (err) return setError(err)
      toast.success('Product added.')
    }
    setModal(false)
  }

  async function toggle(p: Product) {
    if (isManggalehEnabled()) {
      try {
        await setProductActiveFn(p.id, !p.active)
        useApp.setState((s) => ({ products: s.products.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)) }))
        toast.success(p.active ? 'Product deactivated.' : 'Product activated.')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not update the product.')
      }
      return
    }
    toggleActive(p.id)
    toast.success(p.active ? 'Product deactivated.' : 'Product activated.')
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
                <div className="flex min-w-0 gap-sm">
                  {p.images?.[0] ? (
                    <StoredImage src={p.images[0]} alt={p.name} className="h-14 w-14 shrink-0 rounded-lg border border-outline-variant/30 object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
                      <Icon name="image" size={22} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                    <p className="text-label-md capitalize text-on-surface-variant">{p.category} · {formatPrice(p.price)}</p>
                    {p.notes && <p className="mt-xs text-label-md text-on-surface-variant">{p.notes}</p>}
                  </div>
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
                    await toggle(p)
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
          <Field label="Photos (optional)" hint="Up to 5. Large images are automatically resized & compressed.">
            <div className="flex flex-wrap gap-sm">
              {form.images.map((src, i) => (
                <div key={i} className="relative">
                  <StoredImage src={src} alt={`Photo ${i + 1}`} className="h-16 w-16 rounded-lg border border-outline-variant/30 object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Remove photo"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-on-error"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
              ))}
              {form.images.length < 5 && (
                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary">
                  <Icon name={uploading ? 'hourglass_empty' : 'add_a_photo'} size={20} />
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
                </label>
              )}
            </div>
          </Field>
          <Button size="lg" onClick={save} disabled={uploading}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
