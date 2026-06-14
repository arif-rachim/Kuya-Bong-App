import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { create } from 'zustand'
import { cn } from '../lib/cn'
import { Icon } from './Icon'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  show: (kind: ToastKind, message: string) => void
  dismiss: (id: number) => void
}

let counter = 0

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (kind, message) => {
    counter += 1
    const id = counter
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }))
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Fire a toast from anywhere (components, store actions, event handlers). */
export const toast = {
  success: (message: string) => useToastStore.getState().show('success', message),
  error: (message: string) => useToastStore.getState().show('error', message),
  info: (message: string) => useToastStore.getState().show('info', message),
}

const styles: Record<ToastKind, string> = {
  success: 'bg-primary text-on-primary',
  error: 'bg-error text-on-error',
  info: 'bg-inverse-surface text-inverse-on-surface',
}
const icons: Record<ToastKind, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
}

function ToastRow({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), 3200)
    return () => clearTimeout(t)
  }, [item.id, onDismiss])

  return (
    <motion.button
      layout
      onClick={() => onDismiss(item.id)}
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'pointer-events-auto flex w-full max-w-[440px] items-center gap-sm rounded-xl px-md py-sm text-left text-body-md font-medium shadow-soft-up',
        styles[item.kind],
      )}
    >
      <Icon name={icons[item.kind]} size={20} fill />
      <span className="flex-1">{item.message}</span>
    </motion.button>
  )
}

/**
 * Global toast viewport. Rendered once at the app root. Floats above the
 * bottom navigation so confirmation messages are visible regardless of scroll.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mx-auto flex w-full max-w-[480px] flex-col items-center gap-sm px-margin-mobile"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastRow key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
