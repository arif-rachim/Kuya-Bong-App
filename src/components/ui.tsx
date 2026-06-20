/** Basic UI components — "Calm Clinical" design system (Stitch). */
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../lib/cn'
import { Icon } from './Icon'

// Drop the handful of DOM handlers whose names collide with Framer's props.
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onTransitionEnd'
>

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: NativeButtonProps & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg' | 'sm'
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-label-lg text-label-lg rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none'
  const sizes = {
    sm: 'px-3 py-2 text-label-lg',
    md: 'px-md h-12',
    lg: 'px-lg h-14 w-full text-body-md font-semibold',
  }
  const variants = {
    primary: 'bg-primary-container text-on-primary hover:bg-primary',
    secondary: 'bg-transparent text-primary border-2 border-primary hover:bg-primary-fixed/40',
    ghost: 'text-primary hover:bg-surface-container-high',
    danger: 'bg-error text-on-error hover:opacity-90',
  }
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(base, sizes[size], variants[variant], className)}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {children}
    </motion.button>
  )
}

export function Card({
  className,
  children,
  onClick,
  accent,
}: {
  className?: string
  children: ReactNode
  onClick?: () => void
  accent?: 'a' | 'b'
}) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'rounded-xl bg-surface-container-lowest p-md shadow-soft border border-outline-variant/30',
        accent === 'a' && 'clinic-a-accent',
        accent === 'b' && 'clinic-b-accent',
        onClick && 'cursor-pointer transition-shadow hover:shadow-xl',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block min-w-0">
      {label && <span className="mb-base block font-label-lg text-label-lg text-on-surface">{label}</span>}
      {children}
      {hint && !error && <span className="mt-xs block text-label-md text-on-surface-variant">{hint}</span>}
      {error && <span className="mt-xs block text-label-md font-semibold text-error">{error}</span>}
    </label>
  )
}

const inputBase =
  'w-full min-w-0 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70 focus:border-primary transition-colors'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, 'min-h-[96px] resize-none', props.className)} />
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputBase, 'appearance-none', props.className)}>
      {children}
    </select>
  )
}

export function EmptyState({ icon, title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-md py-xl text-center">
      {icon && (
        <div className="mb-sm flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
          <Icon name={icon} className="text-3xl text-outline" />
        </div>
      )}
      <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
      {subtitle && <p className="mt-xs max-w-xs text-body-md text-on-surface-variant">{subtitle}</p>}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-md flex items-center justify-between">
      <h2 className="font-headline-sm text-headline-sm text-on-surface">{children}</h2>
      {action}
    </div>
  )
}

export function Banner({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const styles = {
    info: 'bg-secondary-container text-on-secondary-container',
    error: 'bg-error-container text-on-error-container',
    success: 'bg-primary-fixed text-on-primary-fixed-variant',
  }
  return <div className={cn('rounded-lg px-md py-sm text-body-md font-medium', styles[kind])}>{children}</div>
}
