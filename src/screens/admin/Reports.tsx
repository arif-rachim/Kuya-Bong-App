import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Banner, Button, Card, DateField, EmptyState, Field, Select } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { toast } from '../../components/Toast'
import { useApp } from '../../store/appStore'
import { useCan } from '../../store/selectors'
import { firstOfMonthISO, formatDate, formatPrice, todayISO } from '../../lib/date'

type Category = 'services' | 'products'

export function AdminReports() {
  const users = useApp((s) => s.users)
  const services = useApp((s) => s.services)
  const therapists = useApp((s) => s.therapists)
  const products = useApp((s) => s.products)
  const appointments = useApp((s) => s.appointments)
  const purchases = useApp((s) => s.purchases)
  const canServices = useCan('reportsServices')
  const canProducts = useCan('reportsProducts')

  const [category, setCategory] = useState<Category>(canServices ? 'services' : 'products')
  const [fromDate, setFromDate] = useState(firstOfMonthISO())
  const [toDate, setToDate] = useState(todayISO())
  const [serviceId, setServiceId] = useState('all')
  const [productId, setProductId] = useState('all')

  const patientName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'
  const serviceName = (id: string) => services.find((sv) => sv.id === id)?.name ?? '—'
  const therapistName = (id: string) => therapists.find((t) => t.id === id)?.name ?? '—'

  const invalidRange = fromDate > toDate

  const serviceRows = useMemo(() => {
    if (category !== 'services' || invalidRange) return []
    return appointments
      .filter((a) => a.status === 'Completed' && a.date >= fromDate && a.date <= toDate)
      .filter((a) => (serviceId === 'all' ? true : a.serviceTypeId === serviceId))
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  }, [category, invalidRange, appointments, fromDate, toDate, serviceId])

  const productRows = useMemo(() => {
    if (category !== 'products' || invalidRange) return []
    return purchases
      .filter((p) => p.purchaseDate >= fromDate && p.purchaseDate <= toDate)
      .filter((p) => (productId === 'all' ? true : p.productId === productId))
      .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
  }, [category, invalidRange, purchases, fromDate, toDate, productId])

  const productTotal = productRows.reduce((sum, p) => sum + p.unitPriceAtSale * p.quantity, 0)

  function share() {
    if (invalidRange) return toast.error('Fix the date range first.')
    // Demo: use the browser's print dialog (Save as PDF). Native share is a Capacitor follow-up.
    window.print()
  }

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        subtitle="Ad-hoc income report"
        back
        right={<Button size="sm" variant="secondary" onClick={share}><Icon name="ios_share" size={16} /> PDF</Button>}
      />
      <div className="space-y-md p-md">
        <Card className="space-y-sm bg-surface-container-low">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)} disabled={!(canServices && canProducts)}>
              {canServices && <option value="services">Services (completed sessions)</option>}
              {canProducts && <option value="products">Products (sales)</option>}
            </Select>
          </Field>
          {category === 'services' ? (
            <Field label="Service">
              <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="all">All services</option>
                {services.map((sv) => (
                  <option key={sv.id} value={sv.id}>{sv.name}</option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Product">
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="all">All products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
            <Field label="From">
              <DateField value={fromDate} max={toDate} onChange={setFromDate} />
            </Field>
            <Field label="To">
              <DateField value={toDate} min={fromDate} onChange={setToDate} />
            </Field>
          </div>
        </Card>

        {invalidRange && <Banner kind="error">"From" date must not be later than "To" date.</Banner>}

        {/* Services report */}
        {!invalidRange && category === 'services' && (
          <>
            <Card className="flex items-center justify-between bg-primary-fixed">
              <div>
                <p className="font-label-md text-label-md text-on-primary-fixed-variant">Completed sessions</p>
                <p className="font-headline-md text-headline-md text-on-primary-fixed">{serviceRows.length}</p>
              </div>
              <Icon name="event_available" size={28} className="text-on-primary-fixed-variant" />
            </Card>
            <Banner kind="info">Service income isn't tracked yet (services have no price). This report shows the session count.</Banner>
            {serviceRows.length === 0 ? (
              <EmptyState icon="event_busy" title="No completed sessions" subtitle="Try a wider date range." />
            ) : (
              <div className="space-y-sm">
                {serviceRows.map((a) => (
                  <Card key={a.id} className="p-sm">
                    <p className="font-label-lg text-label-lg text-on-surface">{serviceName(a.serviceTypeId)}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      {formatDate(a.date)} · {a.forMemberName} · {therapistName(a.therapistId)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Products report */}
        {!invalidRange && category === 'products' && (
          <>
            <Card className="flex items-center justify-between bg-primary-fixed">
              <div>
                <p className="font-label-md text-label-md text-on-primary-fixed-variant">Total sales · {productRows.length} item(s)</p>
                <p className="font-headline-md text-headline-md text-on-primary-fixed">{formatPrice(productTotal)}</p>
              </div>
              <Icon name="payments" size={28} className="text-on-primary-fixed-variant" />
            </Card>
            {productRows.length === 0 ? (
              <EmptyState icon="inventory_2" title="No sales in range" subtitle="Try a wider date range." />
            ) : (
              <div className="space-y-sm">
                {productRows.map((p) => (
                  <Card key={p.id} className="p-sm">
                    <div className="flex items-start justify-between gap-sm">
                      <div className="min-w-0">
                        <p className="font-label-lg text-label-lg text-on-surface">{p.productName}</p>
                        <p className="font-label-md text-label-md text-on-surface-variant">
                          {formatDate(p.purchaseDate)} · {patientName(p.patientUserId)} · ×{p.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 font-label-lg text-label-lg text-on-surface">{formatPrice(p.unitPriceAtSale * p.quantity)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
