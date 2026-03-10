import { Link } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

const linkBase =
  'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition hover:bg-zinc-100/80 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50'

const linkActive =
  'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-600 hover:to-fuchsia-600 dark:from-indigo-500 dark:to-fuchsia-500'

function LogoutModal({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Déconnexion
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Es-tu sûr de vouloir te déconnecter ?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

export function Navbar() {
  const { user, logout, loading } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="group inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-sm font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              C
            </span>
            <span className="text-base font-semibold tracking-tight">
              Ciné<span className="text-zinc-500 dark:text-zinc-300">Connect</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={linkBase}
              activeProps={{ className: linkBase + ' ' + linkActive }}
            >
              Accueil
            </Link>
            <Link
              to="/films"
              className={linkBase}
              activeProps={{ className: linkBase + ' ' + linkActive }}
            >
              Films
            </Link>
            <Link
              to="/discussion"
              className={linkBase}
              activeProps={{ className: linkBase + ' ' + linkActive }}
            >
              Discussion
            </Link>
            <Link
              to="/profil"
              className={linkBase}
              activeProps={{ className: linkBase + ' ' + linkActive }}
            >
              Profil
            </Link>

            {!loading && (
              <span className="ml-2 flex items-center gap-2">
                {user ? (
                  <>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{user.username}</span>
                    <button
                      type="button"
                      onClick={() => setShowLogout(true)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : null}
              </span>
            )}
          </nav>
        </div>
      </header>

      <LogoutModal
        open={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={() => { setShowLogout(false); logout() }}
      />
    </>
  )
}

