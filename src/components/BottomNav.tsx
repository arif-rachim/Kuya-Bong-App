import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import { Icon } from './Icon'

export interface NavItem {
  to: string
  label: string
  icon: string
}

/**
 * Bottom navigation bar (mobile). Active item = filled icon + primary color
 * + a thin top indicator. No background "pill" (kept clean & proportional).
 */
export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-outline-variant/40 bg-surface shadow-soft-up"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex items-stretch pt-2">
        {items.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className="relative flex flex-1 flex-col items-center gap-1 px-1 pb-1.5">
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 h-[3px] w-7 rounded-full bg-primary" />
                )}
                <Icon
                  name={icon}
                  fill={isActive}
                  size={24}
                  className={isActive ? 'text-primary' : 'text-on-surface-variant'}
                />
                <span
                  className={cn(
                    'w-full truncate text-center text-[11px] leading-none',
                    isActive ? 'font-semibold text-primary' : 'font-medium text-on-surface-variant',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
