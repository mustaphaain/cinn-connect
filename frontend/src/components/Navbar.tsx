import { Link, useRouterState } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { avatarIdToSrc } from '../lib/avatars'
import PillNav from './PillNav'

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

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
    >
      {isDark ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

export function Navbar() {
  const { user, logout, loading } = useAuth()
  const [showLogout, setShowLogout] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeHref = useRouterState({ select: (s) => s.location.pathname })

  const navItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Films', href: '/films' },
    { label: 'Discussion', href: '/discussion' },
    { label: 'Profil', href: '/profil' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="group inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-sm font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              C
            </span>
            <span className="text-base font-semibold tracking-tight">
              Ciné<span className="text-zinc-500 dark:text-zinc-300">Connect</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <PillNav
              items={navItems}
              activeHref={activeHref}
              ease="power2.out"
              theme="color"
              initialLoadAnimation={false}
            />

            <span className="mx-1 hidden sm:inline" aria-hidden />
            <ThemeToggle />
            {!loading && (
              <span className="ml-1 flex items-center gap-2 sm:ml-2">
                {user ? (
                  <>
                    <img
                      src={avatarIdToSrc(user.avatarUrl)}
                      alt={user.username}
                      className="h-7 w-7 rounded-full border border-zinc-200 dark:border-zinc-700"
                    />
                    <span className="max-w-[8rem] truncate text-sm text-zinc-600 dark:text-zinc-300">
                      {user.username}
                    </span>
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

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileOpen ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-800 md:hidden">
            <div className="grid gap-2">
              <Link
                to="/"
                className={linkBase}
                activeProps={{ className: linkBase + ' ' + linkActive }}
                onClick={() => setMobileOpen(false)}
              >
                Accueil
              </Link>
              <Link
                to="/films"
                className={linkBase}
                activeProps={{ className: linkBase + ' ' + linkActive }}
                onClick={() => setMobileOpen(false)}
              >
                Films
              </Link>
              <Link
                to="/discussion"
                className={linkBase}
                activeProps={{ className: linkBase + ' ' + linkActive }}
                onClick={() => setMobileOpen(false)}
              >
                Discussion
              </Link>
              <Link
                to="/profil"
                className={linkBase}
                activeProps={{ className: linkBase + ' ' + linkActive }}
                onClick={() => setMobileOpen(false)}
              >
                Profil
              </Link>
            </div>

            {!loading && user ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={avatarIdToSrc(user.avatarUrl)}
                    alt={user.username}
                    className="h-7 w-7 rounded-full border border-zinc-200 dark:border-zinc-700"
                  />
                  <span className="truncate text-sm text-zinc-700 dark:text-zinc-200">{user.username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    setShowLogout(true)
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Déconnexion
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      <LogoutModal
        open={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={() => { setShowLogout(false); logout() }}
      />
    </>
  )
}

