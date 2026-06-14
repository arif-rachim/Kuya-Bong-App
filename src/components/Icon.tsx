import { cn } from '../lib/cn'

/** Ikon Material Symbols Outlined. `name` = nama ikon Google (mis. "calendar_month"). */
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
