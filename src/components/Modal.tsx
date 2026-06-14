import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Dialog / bottom-sheet. Standards-compliant: Escape to close, background
 * scroll-lock while open, capped height with internal scroll, sticky header.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-label={title}
    >
      <div className="absolute inset-0 bg-inverse-surface/40" onClick={onClose} />
      <div className="safe-bottom relative z-10 flex max-h-[88vh] w-full max-w-[480px] flex-col rounded-t-2xl bg-surface shadow-xl sm:max-h-[85vh] sm:rounded-2xl">
        {/* Grabber (bottom-sheet affordance on mobile) */}
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-outline-variant sm:hidden" />
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between gap-sm border-b border-outline-variant/30 px-md py-sm">
          {title ? (
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-full p-xs text-on-surface-variant hover:bg-surface-container-high"
          >
            <Icon name="close" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto p-md">{children}</div>
      </div>
    </div>
  )
}
