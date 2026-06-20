import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Logo } from '../../components/Logo'
import { PageIntro } from '../../components/PageIntro'
import { useApp } from '../../store/appStore'
import { isUpcoming, useActivePackage, useCurrentUser } from '../../store/selectors'
import { ClinicBadge } from '../../components/StatusBadge'
import { formatDate, todayISO } from '../../lib/date'

export function PatientHome() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const pkg = useActivePackage(user?.id)
  const appointments = useApp((s) => s.appointments)
  const clinics = useApp((s) => s.clinics)
  const announcements = useApp((s) => s.announcements)
  const activeAnnouncements = announcements.filter((a) => a.published && a.expiryDate >= todayISO()).length
  const upcoming = appointments
    .filter((a) => a.patientUserId === user?.id && isUpcoming(a))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0]
  const clinicName = clinics.find((c) => c.id === upcoming?.clinicId)?.name ?? ''
  const pct = pkg ? Math.round(((pkg.totalSessions - pkg.remaining) / pkg.totalSessions) * 100) : 0

  return (
    <div className="bg-background">
      {/* Top app bar */}
      <header className="safe-top sticky top-0 z-40 flex items-center justify-between bg-surface px-margin-mobile pb-base">
        <Logo className="text-xl" tagline />
        <button
          onClick={() => navigate('/patient/announcements')}
          className="relative rounded-full p-xs text-primary hover:bg-surface-container-high"
          aria-label="Announcements"
        >
          <Icon name="notifications" />
          {activeAnnouncements > 0 && (
            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 font-label-md text-[10px] leading-none text-on-error">
              {activeAnnouncements}
            </span>
          )}
        </button>
      </header>

      <main className="space-y-md px-margin-mobile pt-md">
        <section>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Hello, {user?.name}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">How are you feeling today?</p>
        </section>

        <PageIntro>
          This is your home dashboard. From here you can book your next session, check your package balance, see your
          upcoming appointment, and jump to Family or Clinics. Use the bottom menu to move between sections.
        </PageIntro>

        {/* Book Now hero */}
        <div
          onClick={() => navigate('/patient/book')}
          className="group relative cursor-pointer overflow-hidden rounded-xl bg-primary-container p-lg transition-all hover:shadow-xl active:scale-[0.98]"
        >
          <div className="relative z-10">
            <h2 className="font-headline-md text-headline-md text-on-primary-container">Ready for your next session?</h2>
            <p className="mt-xs font-body-md text-on-primary-container opacity-90">
              Book a physiotherapy or chiropractic appointment in seconds.
            </p>
            <span className="mt-md inline-flex items-center gap-xs rounded-full bg-surface px-lg py-sm font-label-lg text-primary shadow-sm">
              Book Now
              <Icon name="arrow_forward" size={18} />
            </span>
          </div>
          <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-primary opacity-20 blur-3xl transition-transform group-hover:scale-110" />
        </div>

        {/* Package balance */}
        <div
          onClick={() => navigate('/patient/packages')}
          className="cursor-pointer rounded-xl border border-outline-variant bg-secondary-container p-lg shadow-soft"
        >
          <div className="flex items-center justify-between">
            <Icon name="inventory_2" className="text-on-secondary-container" />
            <span className="rounded-full bg-white/40 px-base py-xs font-label-md text-label-md text-on-secondary-container">
              {pkg ? pkg.name : 'No package'}
            </span>
          </div>
          <h3 className="mt-md font-headline-sm text-headline-sm text-on-secondary-container">Package Balance</h3>
          {pkg ? (
            <>
              <div className="mt-sm flex items-baseline gap-xs">
                <span className="font-headline-lg text-headline-lg text-primary">{pkg.remaining}</span>
                <span className="font-body-md text-on-surface-variant">sessions left</span>
              </div>
              <div className="mt-md border-t border-on-secondary-container/10 pt-md">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/30">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-xs font-label-md text-label-md text-on-secondary-container">
                  {pct}% of your pack completed · valid until {formatDate(pkg.expiryDate)}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-sm font-body-md text-on-surface-variant">No active package yet.</p>
          )}
        </div>

        {/* Next appointment */}
        <div className="clinic-a-accent flex flex-col gap-md rounded-xl bg-surface-container-lowest p-lg shadow-soft">
          <div className="flex items-center gap-xs">
            <Icon name="event" className="text-primary" size={18} />
            <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary">Next Appointment</span>
          </div>
          {upcoming ? (
            <Link to={`/patient/appointment/${upcoming.id}`} className="block">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">{formatDate(upcoming.date)}</h4>
              <p className="text-body-md text-on-surface-variant">for {upcoming.forMemberName}</p>
              <div className="mt-md flex items-center gap-md">
                <div className="flex flex-col">
                  <span className="font-label-md text-on-surface-variant">Time</span>
                  <span className="font-label-lg text-primary">{upcoming.start} – {upcoming.end}</span>
                </div>
                <div className="flex flex-col border-l border-outline-variant pl-md">
                  <span className="font-label-md text-on-surface-variant">Location</span>
                  <ClinicBadge clinicId={upcoming.clinicId} name={clinicName} />
                </div>
              </div>
            </Link>
          ) : (
            <p className="text-body-md text-on-surface-variant">No upcoming appointments.</p>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-sm">
          <div onClick={() => navigate('/patient/family')} className="cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
            <Icon name="groups" className="mb-sm text-primary" />
            <p className="font-label-lg text-label-lg text-on-surface">Family</p>
            <p className="font-label-md text-label-md text-on-surface-variant">Link &amp; manage members</p>
          </div>
          <div onClick={() => navigate('/patient/clinics')} className="cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
            <Icon name="location_on" className="mb-sm text-primary" />
            <p className="font-label-lg text-label-lg text-on-surface">Clinics</p>
            <p className="font-label-md text-label-md text-on-surface-variant">Clinic A &amp; B info</p>
          </div>
          <div onClick={() => navigate('/patient/friends')} className="cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
            <Icon name="diversity_3" className="mb-sm text-primary" />
            <p className="font-label-lg text-label-lg text-on-surface">Friends</p>
            <p className="font-label-md text-label-md text-on-surface-variant">Share package credit</p>
          </div>
        </div>
      </main>
    </div>
  )
}
