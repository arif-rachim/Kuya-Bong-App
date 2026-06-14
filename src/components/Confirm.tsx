import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { create } from 'zustand'
import { Button } from './ui'

interface ConfirmOptions {
  title?: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState {
  current: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  open: (opts: ConfirmOptions) => Promise<boolean>
  settle: (ok: boolean) => void
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  current: null,
  open: (opts) => new Promise<boolean>((resolve) => set({ current: { ...opts, resolve } })),
  settle: (ok) => {
    const cur = get().current
    if (cur) cur.resolve(ok)
    set({ current: null })
  },
}))

/**
 * Ask the user to confirm before a consequential action runs.
 * `const ok = await confirm({ ... }); if (!ok) return`
 */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().open(opts)
}

/** Global confirm dialog host. Rendered once at the app root (above modals/toasts). */
export function ConfirmHost() {
  const current = useConfirmStore((s) => s.current)
  const settle = useConfirmStore((s) => s.settle)

  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [current, settle])

  return (
    <AnimatePresence>
      {current && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal>
          <motion.div
            className="absolute inset-0 bg-inverse-surface/40"
            onClick={() => settle(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className="relative z-10 w-full max-w-[420px] rounded-2xl bg-surface p-md shadow-xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{current.title ?? 'Please confirm'}</h3>
            <div className="mt-sm text-body-md text-on-surface-variant">{current.message}</div>
            <div className="mt-md flex gap-sm">
              <Button variant="secondary" className="flex-1" onClick={() => settle(false)}>
                {current.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={current.danger ? 'danger' : 'primary'}
                className="flex-1"
                onClick={() => settle(true)}
              >
                {current.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
