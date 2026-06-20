import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../lib/cn'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { BottomNav, type NavItem } from '../components/BottomNav'
import { useCan } from '../store/selectors'

export function AdminLayout() {
  const location = useLocation()
  const canPatients = useCan('managePatients')
  const canProducts = useCan('manageProducts')

  const items = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', show: true },
    { to: '/admin/calendar', label: 'Calendar', icon: 'calendar_month', show: true },
    { to: '/admin/appointments', label: 'Appointments', icon: 'event', show: true },
    { to: '/admin/patients', label: 'Patients', icon: 'group', show: canPatients },
    { to: '/admin/packages', label: 'Packages', icon: 'inventory_2', show: canPatients },
    { to: '/admin/products', label: 'Products', icon: 'medication', show: canProducts },
    { to: '/admin/settings', label: 'Settings', icon: 'settings', show: true },
  ].filter((i) => i.show)

  // Subset for the mobile bottom nav (shorter labels for proportional fit).
  const mobileTabs: NavItem[] = [
    { to: '/admin/dashboard', label: 'Home', icon: 'dashboard', show: true },
    { to: '/admin/calendar', label: 'Calendar', icon: 'calendar_month', show: true },
    { to: '/admin/appointments', label: 'Visits', icon: 'event', show: true },
    { to: '/admin/patients', label: 'Patients', icon: 'group', show: canPatients },
    { to: '/admin/products', label: 'Products', icon: 'medication', show: canProducts },
    { to: '/admin/settings', label: 'Settings', icon: 'settings', show: true },
  ].filter((i) => i.show).map(({ to, label, icon }) => ({ to, label, icon }))

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1100px] bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-outline-variant/40 bg-surface p-md md:block">
        <div className="mb-lg px-base">
          <Logo className="text-lg" />
          <p className="mt-1.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Admin</p>
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
        <main className="flex-1 pb-28 md:pb-md">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
        <div className="md:hidden">
          <BottomNav items={mobileTabs} />
        </div>
      </div>
    </div>
  )
}
