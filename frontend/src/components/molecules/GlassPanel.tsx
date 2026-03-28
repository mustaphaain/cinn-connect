import type { ReactNode } from 'react'

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function GlassPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-900/55',
        className
      )}
    >
      {children}
    </div>
  )
}

