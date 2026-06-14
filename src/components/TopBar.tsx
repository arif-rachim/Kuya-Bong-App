import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function TopBar({
  title,
  back,
  right,
  subtitle,
}: {
  title: string
  back?: boolean
  right?: ReactNode
  subtitle?: string
}) {
  const navigate = useNavigate()
  return (
    <header className="safe-top sticky top-0 z-40 flex items-center gap-sm border-b border-outline-variant/40 bg-surface/95 px-margin-mobile pb-sm backdrop-blur">
      {back && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="-ml-2 rounded-full p-xs text-primary hover:bg-surface-container-high"
        >
          <Icon name="arrow_back" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-headline-md text-headline-md text-on-surface">{title}</h1>
        {subtitle && <p className="truncate text-label-md text-on-surface-variant">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
