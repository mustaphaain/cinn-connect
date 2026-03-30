import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronRight, Globe, Lock, Moon, Shield, Sun, UserRoundCog, Users } from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'
import { useTheme } from '../../contexts/useTheme'
import { api } from '../../lib/api'
import { GlassPanel } from '../molecules/GlassPanel'
import { ConfirmDialog } from '../molecules/ConfirmDialog'

type NotifPrefs = {
  friendRequests: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

const PREFS_KEY = 'cineconnect.settings.notifications.v1'

function loadPrefs(): NotifPrefs {
  const defaults: NotifPrefs = {
    friendRequests: true,
    weeklyDigest: false,
    productUpdates: true,
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<NotifPrefs> | null
    if (!parsed) return defaults
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

export function ReglagesPage() {
  const { user, loading, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(() => loadPrefs())
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(notifPrefs))
    } catch {
      // ignore
    }
  }, [notifPrefs])

  const { data: friendsData } = useQuery({
    queryKey: ['friends', 'list'],
    queryFn: () => api.friends.list(),
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })

  const pendingCount = friendsData?.pendingReceived?.length ?? 0

  const quickLinks = useMemo(
    () =>
      [
        {
          title: 'Profil',
          desc: 'Pseudo, avatar et aperçu public.',
          icon: <UserRoundCog className="h-5 w-5" />,
          to: '/profil',
        },
        {
          title: 'Sécurité',
          desc: 'Mot de passe et session.',
          icon: <Shield className="h-5 w-5" />,
          to: '/profil',
          search: { tab: 'security' as const },
        },
        {
          title: 'Amis',
          desc: 'Demandes et gestion.',
          icon: <Users className="h-5 w-5" />,
          to: '/profil',
          search: { tab: 'friends' as const },
          badge: pendingCount > 0 ? `${pendingCount}` : undefined,
        },
      ] as const,
    [pendingCount]
  )

  return (
    <section className="space-y-6">
      <GlassPanel className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/15 to-rose-500/15 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Réglages
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Paramètres du compte
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              Personnalise ton expérience, gère tes notifications et ta sécurité.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white/70 text-zinc-700 shadow-sm transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-200 dark:hover:bg-zinc-950/80"
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
            </button>
            <Link
              to="/profil"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
            >
              Retour au profil
            </Link>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <GlassPanel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Raccourcis
            </p>
            <div className="mt-4 grid gap-3">
              {quickLinks.map((q) => (
                <Link
                  key={q.title}
                  to={q.to}
                  search={'search' in q ? q.search : undefined}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                      {q.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        <span className="truncate">{q.title}</span>
                        {q.badge ? (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-1 text-[10px] font-semibold text-white shadow ring-1 ring-black/5 dark:ring-white/10">
                            {q.badge}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{q.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 text-zinc-400 transition group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                </Link>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Apparence
            </p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 text-left shadow-sm backdrop-blur-md transition hover:bg-white/75 dark:border-zinc-800/70 dark:bg-zinc-950/35"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thème</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Actuel : {theme === 'dark' ? 'Sombre' : 'Clair'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                  Basculer
                </span>
              </button>

              <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Langue</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Français (bientôt configurable)</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Notifications
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <Bell className="h-4 w-4" />
                {user ? `${pendingCount} demande(s)` : 'Connexion requise'}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    key: 'friendRequests',
                    title: "Demandes d'amis",
                    desc: 'Quand quelqu’un t’ajoute.',
                  },
                  {
                    key: 'weeklyDigest',
                    title: 'Récap hebdo',
                    desc: 'Suggestions & tendances.',
                  },
                  {
                    key: 'productUpdates',
                    title: 'Actus produit',
                    desc: 'Nouveautés CinéConnect.',
                  },
                ] as const
              ).map((t) => (
                <label
                  key={t.key}
                  className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md transition hover:bg-white/75 dark:border-zinc-800/70 dark:bg-zinc-950/35"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t.title}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs[t.key]}
                    onChange={(e) => setNotifPrefs((p) => ({ ...p, [t.key]: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-indigo-600"
                  />
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Ces préférences sont sauvegardées localement (front) pour l’instant.
            </p>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Confidentialité & sécurité
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/profil"
                search={{ tab: 'customize' }}
                className="group flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                    <UserRoundCog className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Identité</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Pseudo, avatar.</p>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 text-zinc-400 transition group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
              </Link>

              <Link
                to="/profil"
                search={{ tab: 'security' }}
                className="group flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Mot de passe</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Changer et sécuriser.</p>
                  </div>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 text-zinc-400 transition group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
              </Link>

              <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Visibilité</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Options de profil public (à venir).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Zone sensible
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Déconnexion</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Ferme la session sur cet appareil.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!user || loading) return
                  setConfirmLogoutOpen(true)
                }}
                disabled={loading || !user}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/45"
              >
                Se déconnecter
              </button>
            </div>
            {!user ? (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Connecte-toi pour accéder à tous les réglages du compte.
              </p>
            ) : null}
          </GlassPanel>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Se déconnecter ?"
        description="Tu vas fermer la session sur cet appareil."
        confirmText="Se déconnecter"
        cancelText="Annuler"
        destructive
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={() => {
          setConfirmLogoutOpen(false)
          logout()
        }}
      />
    </section>
  )
}
