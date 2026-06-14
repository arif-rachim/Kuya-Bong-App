import type { ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * A subtle "what is this page / what can you do here" helper, shown at the top
 * of patient screens so first-time users understand the page at a glance.
 */
export function PageIntro({ children, icon = 'lightbulb' }: { children: ReactNode; icon?: string }) {
  return (
    <div className="flex items-start gap-sm">
      <Icon name={icon} size={20} className="mt-0.5 shrink-0 text-primary" />
      <p className="text-body-md text-on-surface-variant">{children}</p>
    </div>
  )
}
