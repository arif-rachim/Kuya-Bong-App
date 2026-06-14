import { cn } from '../lib/cn'

/** Material Symbols Outlined icon. `name` = Google icon name (e.g. "calendar_month"). */
export function Icon({
  name,
  className,
  fill,
  size,
}: {
  name: string
  className?: string
  fill?: boolean
  size?: number
}) {
  return (
    <span
      className={cn('material-symbols-outlined', fill && 'fill', className)}
      style={size ? { fontSize: size } : undefined}
      aria-hidden
    >
      {name}
    </span>
  )
}
