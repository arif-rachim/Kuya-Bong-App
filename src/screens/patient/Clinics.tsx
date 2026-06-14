import { TopBar } from '../../components/TopBar'
import { Card } from '../../components/ui'
import { ClinicBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { PageIntro } from '../../components/PageIntro'
import { useApp } from '../../store/appStore'

export function Clinics() {
  const clinics = useApp((s) => s.clinics)
  return (
    <div className="min-h-screen">
      <TopBar title="Clinics" back />
      <div className="space-y-md px-margin-mobile py-md">
        <PageIntro>
          Locations for both of our clinics. Check each clinic's address before your visit — you choose which clinic
          when you book an appointment.
        </PageIntro>
        {clinics.map((c) => {
          const accent = c.id === 'clinic-a' ? 'a' : 'b'
          return (
            <Card key={c.id} accent={accent}>
              <ClinicBadge clinicId={c.id} name={c.name} />
              <p className="mt-sm font-headline-sm text-headline-sm text-on-surface">{c.name}</p>
              <div className="mt-xs flex items-start gap-xs text-on-surface-variant">
                <Icon name="location_on" size={18} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-body-md">{c.address}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
