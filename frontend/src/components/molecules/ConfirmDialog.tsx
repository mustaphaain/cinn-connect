import { useEffect } from 'react'
import { GlassPanel } from './GlassPanel'

type Props = {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div className="relative mx-auto flex min-h-dvh max-w-lg items-center px-4 py-10">
        <GlassPanel className="w-full p-5 shadow-xl">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
          {description ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{description}</p> : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={
                destructive
                  ? 'inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/45'
                  : 'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 dark:ring-white/10'
              }
            >
              {confirmText}
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}

