import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '../lib/cn'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { BottomNav, type NavItem } from '../components/BottomNav'

// Full navigation shown in the desktop sidebar.
const items = [
  { to: '/patient/home', label: 'Home', icon: 'home' },
  { to: '/patient/book', label: 'Book', icon: 'calendar_month' },
  { to: '/patient/appointments', label: 'My Visits', icon: 'event' },
  { to: '/patient/packages', label: 'Packages', icon: 'inventory_2' },
  { to: '/patient/family', label: 'Family', icon: 'groups' },
  { to: '/patient/clinics', label: 'Clinics', icon: 'location_on' },
  { to: '/patient/profile', label: 'Profile', icon: 'person' },
]

// Subset for the mobile bottom nav (shorter labels for proportional fit).
const mobileTabs: NavItem[] = [
  { to: '/patient/home', label: 'Home', icon: 'home' },
  { to: '/patient/book', label: 'Book', icon: 'calendar_month' },
  { to: '/patient/appointments', label: 'Visits', icon: 'event' },
  { to: '/patient/packages', label: 'Packages', icon: 'inventory_2' },
  { to: '/patient/profile', label: 'Profile', icon: 'person' },
]

export function PatientLayout() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1100px] bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-outline-variant/40 bg-surface p-md md:block">
        <div className="mb-lg px-base">
          <Logo className="text-lg" />
          <p className="mt-1.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Patient</p>
        </div>
        <nav className="space-y-xs">
          {items.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-sm rounded-lg px-sm py-sm font-label-lg text-label-lg',
                  isActive ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-container',
                )
              }
            >
              <Icon name={icon} size={22} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Content column — centered & width-capped on wide screens, full-width on mobile. */}
        <main className="flex-1 pb-28 md:pb-md">
          <div className="mx-auto w-full max-w-[640px]">
            <Outlet />
          </div>
        </main>
        <div className="md:hidden">
          <BottomNav items={mobileTabs} />
        </div>
      </div>
    </div>
  )
}
