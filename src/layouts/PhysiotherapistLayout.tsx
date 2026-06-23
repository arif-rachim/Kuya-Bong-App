import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../lib/cn'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { BottomNav, type NavItem } from '../components/BottomNav'

const items = [
  { to: '/physio/schedule', label: 'My Schedule', icon: 'calendar_month' },
  { to: '/physio/profile', label: 'Profile', icon: 'person' },
]
const mobileTabs: NavItem[] = items

export function PhysiotherapistLayout() {
  const location = useLocation()
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1100px] bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-outline-variant/40 bg-surface p-md md:block">
        <div className="mb-lg px-base">
          <Logo className="text-lg" />
          <p className="mt-1.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Physiotherapist</p>
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
            className="mx-auto w-full max-w-[640px]"
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
