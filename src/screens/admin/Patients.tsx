import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Card, EmptyState, Input } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useApp } from '../../store/appStore'

export function AdminPatients() {
  const allUsers = useApp((s) => s.users)
  const patients = allUsers.filter((u) => u.role === 'patient')
  const [q, setQ] = useState('')

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.email.toLowerCase().includes(q.toLowerCase()) ||
      p.mobile.includes(q),
  )

  return (
    <div>
      <PageHeader title="Patients" subtitle="Search & open patient profile" />
      <div className="space-y-sm p-md">
        <div className="relative">
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, or mobile" className="pl-12" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="person_search"
            title="No results"
            subtitle={q ? `Patient "${q}" is not registered.` : 'No patients yet.'}
          />
        ) : (
          filtered.map((p) => (
            <Link key={p.id} to={`/admin/patient/${p.id}`} className="block">
              <Card onClick={() => {}}>
                <div className="flex items-center justify-between gap-sm">
                  <div className="min-w-0">
                    <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                    <p className="truncate text-label-md text-on-surface-variant">{p.email} · {p.mobile}</p>
                  </div>
                  <Icon name="chevron_right" className="text-on-surface-variant" />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
