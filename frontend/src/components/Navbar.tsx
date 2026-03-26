import { Link, useRouterState } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, Settings } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { api } from '../lib/api'
import { avatarIdToSrc } from '../lib/avatars'
import PillNav from './PillNav'

const linkBase =
  'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition hover:bg-zinc-100/80 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50'

const linkActive =
  'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-600 hover:to-fuchsia-600 dark:from-indigo-500 dark:to-fuchsia-500'

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
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeHref = useRouterState({ select: (s) => s.location.pathname })
  const [notifOpen, setNotifOpen] = useState(false)
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const notifButtonRef = useRef<HTMLButtonElement>(null)
  const [notifPos, setNotifPos] = useState<{ top: number; left: number } | null>(null)

  const navItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Films', href: '/films' },
    { label: 'Discussion', href: '/discussion' },
    { label: 'Profil', href: '/profil' },
  ]

  const { data: friendsData } = useQuery({
    queryKey: ['friends', 'list'],
    queryFn: () => api.friends.list(),
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })

  const pendingCount = friendsData?.pendingReceived?.length ?? 0

  const updateNotifPos = () => {
    const btn = notifButtonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const width = 320 // tailwind w-80
    const margin = 12
    const left = Math.max(margin, Math.min(window.innerWidth - margin - width, rect.right - width))
    const top = Math.min(window.innerHeight - margin, rect.bottom + 8)
    setNotifPos({ top, left })
  }

  useEffect(() => {
    if (!notifOpen) return
    updateNotifPos()

    const onPointerDown = (e: MouseEvent) => {
      const el = notifPanelRef.current
      if (!el) return
      if (!(e.target instanceof Node)) return
      if (!el.contains(e.target)) setNotifOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false)
    }
    const onScrollOrResize = () => updateNotifPos()
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize)
    }
  }, [notifOpen])

  return (
    <>
      <header
        className="sticky top-0 z-[99999] border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/75"
        style={{ zIndex: 99999 }}
      >
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
                    <div className="relative" ref={notifPanelRef}>
                      <button
                        ref={notifButtonRef}
                        type="button"
                        onClick={() => setNotifOpen((v) => !v)}
                        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        aria-label="Notifications"
                        title="Notifications"
                      >
                        <Bell className="h-4 w-4" />
                        {pendingCount > 0 ? (
                          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-1 text-[10px] font-semibold text-white shadow ring-1 ring-black/5 dark:ring-white/10">
                            {pendingCount > 9 ? '9+' : pendingCount}
                          </span>
                        ) : null}
                      </button>
                    </div>

                    {notifOpen && notifPos
                      ? createPortal(
                          <div
                            className="fixed z-[2147483647] w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-950/90"
                            style={{ top: notifPos.top, left: notifPos.left }}
                            role="dialog"
                            aria-label="Notifications"
                          >
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</p>
                              <Link
                                to="/profil"
                                search={{ tab: undefined }}
                                className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                                onClick={() => setNotifOpen(false)}
                              >
                                Ouvrir profil
                              </Link>
                            </div>
                            <div className="border-t border-zinc-200/80 dark:border-zinc-800/80" />
                            {pendingCount === 0 ? (
                              <p className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                                Rien de nouveau pour l’instant.
                              </p>
                            ) : (
                              <div className="max-h-72 overflow-auto">
                                {friendsData?.pendingReceived?.slice(0, 6).map((p) => (
                                  <div
                                    key={p.userId}
                                    className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                        {p.username}
                                      </p>
                                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                        Demande d’ami reçue
                                      </p>
                                    </div>
                                    <Link
                                      to="/profil"
                                      search={{ tab: undefined }}
                                      className="shrink-0 rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                      onClick={() => setNotifOpen(false)}
                                    >
                                      Voir
                                    </Link>
                                  </div>
                                ))}
                                {pendingCount > 6 ? (
                                  <p className="px-4 pb-4 text-xs text-zinc-500 dark:text-zinc-400">
                                    +{pendingCount - 6} autres demandes
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </div>,
                          document.body
                        )
                      : null}

                    <Link
                      // Route type union can lag behind file-based generation in-editor; keep runtime path stable.
                      to={'/reglages' as any}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      aria-label="Paramètres"
                      title="Paramètres"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>

                    <Link to="/profil" search={{ tab: undefined }} aria-label="Ouvrir mon profil" title="Mon profil">
                      <img
                        src={avatarIdToSrc(user.avatarUrl)}
                        alt={user.username}
                        className="h-7 w-7 rounded-full border border-zinc-200 transition hover:opacity-90 dark:border-zinc-700"
                      />
                    </Link>
                    <span className="max-w-[8rem] truncate text-sm text-zinc-600 dark:text-zinc-300">
                      {user.username}
                    </span>
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
                search={{ tab: undefined }}
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
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={'/reglages' as any}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                >
                  Paramètres
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>
    </>
  )
}

