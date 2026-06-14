import { cn } from '../lib/cn'

/**
 * Realief Expert brand wordmark: "Realief" + an "EXPERT" pill, with an optional
 * tagline. Sizes are em-based, so set the scale via a text-size class on
 * `className` (e.g. `text-2xl`, `text-4xl`).
 *
 * - variant "color"  → green wordmark for light backgrounds.
 * - variant "onDark" → white wordmark (inverted pill) for colored backgrounds.
 */
export function Logo({
  tagline = false,
  variant = 'color',
  className,
}: {
  tagline?: boolean
  variant?: 'color' | 'onDark'
  className?: string
}) {
  const onDark = variant === 'onDark'
  return (
    <div className={cn('inline-flex flex-col items-start leading-none', className)}>
      <span className="inline-flex items-center font-extrabold tracking-tight">
        <span className={onDark ? 'text-white' : 'text-primary-container'}>Realief</span>
        <span
          className={cn(
            'ml-[0.12em] rounded-[0.18em] px-[0.18em] py-[0.04em]',
            onDark ? 'bg-white text-primary-container' : 'bg-primary-container text-white',
          )}
        >
          EXPERT
        </span>
      </span>
      {tagline && (
        <span
          className={cn(
            'mt-[0.45em] text-[0.4em] font-bold tracking-wide',
            onDark ? 'text-white/90' : 'text-primary-container',
          )}
        >
          Expert Care, Real Relief
        </span>
      )}
    </div>
  )
}
