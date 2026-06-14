import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

/** Admin page header (Calm Clinical tokens). */
export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string
  subtitle?: string
  back?: boolean
  right?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="safe-top sticky top-0 z-40 flex items-center gap-sm border-b border-outline-variant/40 bg-surface/95 px-margin-mobile pb-md backdrop-blur">
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
        <h1 className="truncate font-headline-lg-mobile text-headline-lg-mobile text-primary">{title}</h1>
        {subtitle && <p className="text-label-md text-on-surface-variant">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
