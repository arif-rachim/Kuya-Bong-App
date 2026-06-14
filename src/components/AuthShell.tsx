import type { ReactNode } from 'react'

/**
 * Pre-login screen shell: a full-bleed gradient background with a centered,
 * phone-width content column. Keeps all auth screens responsive on desktop
 * (gradient fills the viewport; content stays centered and readable).
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen w-full flex-col"
      style={{ background: 'linear-gradient(135deg, #fcf9f8 0%, #e8f5e9 100%)' }}
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">{children}</div>
    </div>
  )
}
