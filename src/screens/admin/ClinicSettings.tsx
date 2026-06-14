import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Button, Card, Field, Input } from '../../components/ui'
import { toast } from '../../components/Toast'
import { useApp } from '../../store/appStore'

export function ClinicSettings() {
  const clinics = useApp((s) => s.clinics)
  const updateClinicName = useApp((s) => s.updateClinicName)
  const [names, setNames] = useState<Record<string, string>>(
    Object.fromEntries(clinics.map((c) => [c.id, c.name])),
  )

  function save(id: string) {
    const err = updateClinicName(id, names[id] ?? '')
    if (err) return toast.error(err)
    toast.success('Clinic name updated.')
  }

  return (
    <div>
      <PageHeader title="Clinic Settings" subtitle="Edit clinic names" back />
      <div className="space-y-md p-md">
        {clinics.map((c) => (
          <Card key={c.id} accent={c.id === 'clinic-a' ? 'a' : 'b'} className="space-y-sm">
            <Field label={`Name (${c.id === 'clinic-a' ? 'Clinic A' : 'Clinic B'})`}>
              <Input
                value={names[c.id] ?? ''}
                onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))}
              />
            </Field>
            <p className="text-label-md text-on-surface-variant">{c.address}</p>
            <Button onClick={() => save(c.id)}>Save</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
