import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Bolt,
  ChevronLeft,
  Cog,
  Crown,
  ExternalLink,
  Gauge,
  Lock,
  Shield,
  Swords,
  UserRoundCog,
  Users,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api, getApiBase, type FavoriteFilm, type PublicUser } from '../lib/api'
import { AVATAR_PRESETS, avatarIdToSrc } from '../lib/avatars'
import { getBestPosterUrl } from '../lib/poster'

export const Route = createFileRoute('/profil')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: ProfilPage,
})

type ProfileTab = 'home' | 'customize' | 'security' | 'friends'

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function GlassPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
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

function SegmentedBar({
  value,
  max,
  segments = 10,
  className,
}: {
  value: number
  max: number
  segments?: number
  className?: string
}) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max))
  const filled = Math.floor(ratio * segments)
  const partial = ratio * segments - filled

  return (
    <div className={cx('flex gap-1', className)} aria-hidden>
      {Array.from({ length: segments }).map((_, idx) => {
        const isFilled = idx < filled
        const isPartial = idx === filled && partial > 0 && filled < segments
        return (
          <div
            key={`seg-${idx}`}
            className={cx(
              'h-3 flex-1 rounded-sm bg-zinc-200/70 dark:bg-zinc-800/70',
              isFilled && 'bg-gradient-to-r from-indigo-500 to-fuchsia-500',
              isPartial && 'bg-gradient-to-r from-indigo-500/70 to-zinc-200/60 dark:to-zinc-800/70'
            )}
          />
        )
      })}
    </div>
  )
}

function ProfilPage() {
  const { user, loading, login, register, logout } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [tab, setTab] = useState<ProfileTab>('home')
  const search = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[0].id)
  const [friends, setFriends] = useState<
    { id: number; username: string; email: string; avatarUrl?: string | null }[]
  >([])
  const [pendingReceived, setPendingReceived] = useState<{ id: number; username: string; userId: number }[]>(
    []
  )
  const [pendingSent, setPendingSent] = useState<{ id: number; username: string; userId: number }[]>([])
  const [friendSearchInput, setFriendSearchInput] = useState('')
  const [friendSearchResults, setFriendSearchResults] = useState<
    { id: number; username: string; avatarUrl?: string | null }[]
  >([])
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState<string | null>(null)
  const [publicData, setPublicData] = useState<PublicUser | null>(null)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securityOk, setSecurityOk] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [favorites, setFavorites] = useState<FavoriteFilm[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [favoritesError, setFavoritesError] = useState<string | null>(null)
  const randomAvatar = () => AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].id

  const operatorLevel = 12
  const operatorXp = 1240
  const operatorXpNext = 2000

  const kpis = useMemo(() => {
    const moviesWatched = favorites.length
    const friendsCount = publicData?.friendsCount ?? friends.length
    const streakDays = 14
    return [
      {
        label: 'Films favoris',
        value: String(moviesWatched),
        icon: <Crown className="h-4 w-4" />,
        accent: 'from-amber-500/20 to-rose-500/10 dark:from-amber-500/15 dark:to-rose-500/10',
      },
      {
        label: 'Amis',
        value: String(friendsCount),
        icon: <Users className="h-4 w-4" />,
        accent: 'from-indigo-500/20 to-fuchsia-500/10 dark:from-indigo-500/15 dark:to-fuchsia-500/10',
      },
      {
        label: 'Streak',
        value: `${streakDays}j`,
        icon: <Bolt className="h-4 w-4" />,
        accent: 'from-emerald-500/20 to-sky-500/10 dark:from-emerald-500/15 dark:to-sky-500/10',
      },
    ]
  }, [favorites.length, friends.length, publicData?.friendsCount])

  useEffect(() => {
    const requested = search.tab
    if (!requested) return
    if (requested === 'home' || requested === 'customize' || requested === 'security' || requested === 'friends') {
      setTab(requested)
    }
  }, [search.tab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, username, selectedAvatar)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const refreshSocial = async () => {
    if (!user) return
    setSocialLoading(true)
    try {
      const data = await api.friends.list()
      setFriends(data.friends)
      setPendingReceived(data.pendingReceived)
      setPendingSent(data.pendingSent)
      setSocialError(null)
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSocialLoading(false)
    }
  }

  const refreshFavorites = async () => {
    if (!user) return
    setFavoritesLoading(true)
    try {
      const list = await api.favorites.list()
      setFavorites(list)
      setFavoritesError(null)
    } catch (err) {
      setFavoritesError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setFavoritesLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    setSelectedAvatar(user.avatarUrl ?? AVATAR_PRESETS[0].id)
    setUsername(user.username)
    refreshSocial()
    refreshFavorites()
    api.users
      .getPublic(user.id)
      .then(setPublicData)
      .catch(() => setPublicData(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (user) return
    if (mode === 'register') {
      setSelectedAvatar(randomAvatar())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.id])

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</p>
      </section>
    )
  }

  if (user) {
    const saveProfile = async () => {
      setSubmitting(true)
      setError(null)
      try {
        const updated = await api.users.updateMe({ username: username.trim(), avatarUrl: selectedAvatar })
        setUsername(updated.user.username)
        setPublicData((prev) =>
          prev
            ? { ...prev, username: updated.user.username, avatarUrl: updated.user.avatarUrl ?? null }
            : prev
        )
        setTab('home')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      } finally {
        setSubmitting(false)
      }
    }

    const sendRequest = async (friendId: number) => {
      if (!friendId) {
        setSocialError('Utilisateur invalide')
        return
      }
      try {
        await api.friends.request(friendId)
        setFriendSearchInput('')
        setFriendSearchResults([])
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const acceptRequest = async (friendId: number) => {
      try {
        await api.friends.accept(friendId)
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const refuseRequest = async (friendId: number) => {
      try {
        await api.friends.refuse(friendId)
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const cancelRequest = async (friendId: number) => {
      try {
        await api.friends.cancel(friendId)
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const searchUsers = async () => {
      if (friendSearchInput.trim().length < 2) {
        setFriendSearchResults([])
        return
      }
      try {
        const rows = await api.users.search(friendSearchInput.trim())
        setFriendSearchResults(rows)
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const friendIds = new Set(friends.map((f) => f.id))
    const pendingSentIds = new Set(pendingSent.map((p) => p.userId))
    const pendingReceivedIds = new Set(pendingReceived.map((p) => p.userId))

    const changePassword = async () => {
      setSecurityError(null)
      setSecurityOk(null)
      if (!currentPassword || !newPassword || !newPasswordConfirm) {
        setSecurityError('Tous les champs sont requis')
        return
      }
      if (newPassword !== newPasswordConfirm) {
        setSecurityError('La confirmation ne correspond pas')
        return
      }
      try {
        await api.users.changePassword({ currentPassword, newPassword })
        setSecurityOk('Mot de passe mis à jour')
        setCurrentPassword('')
        setNewPassword('')
        setNewPasswordConfirm('')
      } catch (err) {
        setSecurityError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const removeFavorite = async (imdbId: string) => {
      try {
        await api.favorites.remove(imdbId)
        await refreshFavorites()
      } catch (err) {
        setFavoritesError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    return (
      <section className="space-y-6">
        {tab === 'home' && (
          <>
            <GlassPanel className="relative overflow-hidden p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/25 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/15 to-rose-500/15 blur-2xl" />

              <div className="relative space-y-5">
                {/* Mobile header (inspired by the provided HTML) */}
                <div className="flex items-center justify-between gap-4 sm:hidden">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500/25 to-fuchsia-500/25 blur-xl" />
                      <img
                        src={avatarIdToSrc(publicData?.avatarUrl ?? user.avatarUrl)}
                        alt="Avatar"
                        className="relative h-12 w-12 rounded-full border border-amber-300/50 bg-zinc-100 shadow-sm dark:bg-zinc-800"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        Level {operatorLevel}
                      </p>
                      <div className="mt-1 max-w-[11rem]">
                        <SegmentedBar value={operatorXp} max={operatorXpNext} segments={6} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <a
                    href={'/user/' + user.id}
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/60 px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm backdrop-blur-md transition hover:bg-white/75 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-50 dark:hover:bg-zinc-950/70"
                  >
                    Profil public
                  </a>
                </div>

                {/* Desktop/tablet header */}
                <div className="hidden gap-6 sm:grid lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500/25 to-fuchsia-500/25 blur-xl" />
                        <div className="relative grid h-16 w-16 place-items-center rounded-full border border-zinc-200 bg-white/80 text-zinc-950 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-50">
                          <span className="text-xl font-semibold tabular-nums">{operatorLevel}</span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Operator profile
                        </p>
                        <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {publicData?.username ?? user.username}
                        </h1>
                        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <img
                        src={avatarIdToSrc(publicData?.avatarUrl ?? user.avatarUrl)}
                        alt="Avatar"
                        className="h-14 w-14 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                      />
                      <div className="flex flex-wrap gap-2">
                        <a
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
                          href={'/user/' + user.id}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Profil public
                        </a>
                        <button
                          type="button"
                          onClick={() => setTab('customize')}
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
                        >
                          <UserRoundCog className="h-4 w-4" />
                          Personnaliser
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab('security')}
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
                        >
                          <Shield className="h-4 w-4" />
                          Sécurité
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab('friends')}
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
                        >
                          <Users className="h-4 w-4" />
                          Amis
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                          XP progression
                        </p>
                        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {operatorXp.toLocaleString('fr-FR')} / {operatorXpNext.toLocaleString('fr-FR')} XP
                        </p>
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        {Math.round((operatorXp / operatorXpNext) * 100)}% vers niveau {operatorLevel + 1}
                      </p>
                    </div>
                    <SegmentedBar value={operatorXp} max={operatorXpNext} className="mt-3" />
                  </div>
                </div>

                {/* Mobile KPI carousel */}
                <div className="sm:hidden">
                  <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
                    {kpis.map((k) => (
                      <div
                        key={k.label}
                        className={cx(
                          'snap-start',
                          'w-44 shrink-0 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35',
                          'relative overflow-hidden'
                        )}
                      >
                        <div className={cx('pointer-events-none absolute inset-0 bg-gradient-to-br', k.accent)} />
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                              {k.label}
                            </p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                              {k.value}
                            </p>
                          </div>
                          <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                            {k.icon}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop KPI grid */}
                <div className="hidden gap-3 sm:grid sm:grid-cols-3 lg:pl-0">
                  {kpis.map((k) => (
                    <div
                      key={k.label}
                      className={cx(
                        'rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35',
                        'relative overflow-hidden'
                      )}
                    >
                      <div className={cx('pointer-events-none absolute inset-0 bg-gradient-to-br', k.accent)} />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            {k.label}
                          </p>
                          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                            {k.value}
                          </p>
                        </div>
                        <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                          {k.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-3">
                <GlassPanel className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Compétences
                    </p>
                    <Swords className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                  </div>

                  <div className="mt-4 space-y-4">
                    {[
                      { label: 'Critique', level: 4, rank: 'Master', value: 0.85 },
                      { label: 'Explorateur', level: 2, rank: 'Adepte', value: 0.4 },
                      { label: 'Marathon', level: 3, rank: 'Confirmé', value: 0.62 },
                    ].map((s) => (
                      <div key={s.label} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-widest">
                          <span className="text-zinc-800 dark:text-zinc-200">
                            {s.label} lvl {s.level}
                          </span>
                          <span className="text-indigo-600 dark:text-indigo-400">{s.rank}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                            style={{ width: `${Math.round(s.value * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Succès
                    </p>
                    <Gauge className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {[
                      { id: 'verified', label: 'Vérifié', locked: false },
                      { id: 'reviewer', label: 'Top reviewer', locked: false },
                      { id: 'beta', label: 'Bêta', locked: false },
                      { id: 'locked-1', label: 'À débloquer', locked: true },
                      { id: 'locked-2', label: 'À débloquer', locked: true },
                      { id: 'locked-3', label: 'À débloquer', locked: true },
                      { id: 'locked-4', label: 'À débloquer', locked: true },
                      { id: 'locked-5', label: 'À débloquer', locked: true },
                    ].map((b) => (
                      <div
                        key={b.id}
                        title={b.label}
                        className={cx(
                          'grid aspect-square place-items-center rounded-xl border',
                          b.locked
                            ? 'border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-500'
                            : 'border-zinc-200 bg-white/70 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300'
                        )}
                      >
                        {b.locked ? <Lock className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </div>

              <div className="space-y-6 lg:col-span-6">
                <GlassPanel className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Collection rapide
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Tes favoris, prêts à relancer une séance.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={refreshFavorites}
                      disabled={favoritesLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
                    >
                      <Cog className="h-4 w-4" />
                      Actualiser
                    </button>
                  </div>

                  {favoritesError ? (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">{favoritesError}</p>
                  ) : null}

                  {favoritesLoading ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Chargement…</p>
                  ) : favorites.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                      Aucun favori pour le moment. Va sur une fiche film et clique sur ♡.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {favorites.slice(0, 6).map((f) => (
                        <div
                          key={f.imdbId}
                          className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
                        >
                          <Link to="/film/$id" params={{ id: f.imdbId }} className="block">
                            <div className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                              {f.poster ? (
                                <img
                                  src={getBestPosterUrl(f.poster, 'thumb') ?? f.poster}
                                  alt={f.title}
                                  className="aspect-[2/3] w-full object-cover transition group-hover:scale-[1.02]"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex aspect-[2/3] items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                                  Pas d’affiche
                                </div>
                              )}
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                            </div>
                          </Link>

                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to="/film/$id"
                                  params={{ id: f.imdbId }}
                                  className="block truncate text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                                  title={f.title}
                                >
                                  {f.title}
                                </Link>
                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{f.year ?? '—'}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFavorite(f.imdbId)}
                                className="shrink-0 rounded-lg border border-zinc-200 bg-white/70 px-2 py-1 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
                                title="Retirer des favoris"
                                aria-label="Retirer des favoris"
                              >
                                ♥
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {favorites.length > 6 ? (
                    <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                      Affichage limité à 6 favoris sur {favorites.length}.
                    </p>
                  ) : null}
                </GlassPanel>

                <GlassPanel className="relative overflow-hidden p-6 text-center">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.32),transparent)]" />
                  <div className="relative mx-auto max-w-lg space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Mission suivante
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Trouve un film à lancer ce soir
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Explore la base, ajoute un favori et partage-le à tes amis.
                    </p>
                    <Link
                      to="/films"
                      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
                    >
                      Explorer les films
                    </Link>
                  </div>
                </GlassPanel>
              </div>

              <div className="space-y-6 lg:col-span-3">
                <GlassPanel className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Missions du jour
                    </p>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">reset 04:22</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      { title: "Cinéphile d'Europe", desc: 'Regarder 1 film en VF/FR', xp: 50, progress: 0 },
                      { title: 'Critical mass', desc: 'Ajouter 3 favoris', xp: 100, progress: Math.min(1, favorites.length / 3) },
                      { title: 'Squad link', desc: 'Ajouter 1 ami', xp: 75, progress: Math.min(1, (publicData?.friendsCount ?? friends.length) / 1) },
                    ].map((m) => (
                      <div
                        key={m.title}
                        className="rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{m.title}</p>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">+{m.xp} XP</p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{m.desc}</p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                            style={{ width: `${Math.round(m.progress * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </div>
            </div>
          </>
        )}

        {tab === 'customize' && (
          <GlassPanel className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                  <UserRoundCog className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Personnalisation</h2>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    Mets à jour ton pseudo et ton avatar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Pseudo
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
                />

                {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 dark:ring-white/10"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('home')}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
                  >
                    Annuler
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Avatar
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {AVATAR_PRESETS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={cx(
                        'rounded-full p-1 transition',
                        selectedAvatar === av.id
                          ? 'ring-2 ring-indigo-500'
                          : 'ring-1 ring-zinc-200 hover:ring-indigo-300 dark:ring-zinc-700 dark:hover:ring-indigo-700/60'
                      )}
                      title={av.label}
                      aria-label={`Choisir l'avatar ${av.label}`}
                    >
                      <img src={av.src} alt={av.label} className="h-12 w-12 rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

        {tab === 'security' && (
          <GlassPanel className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sécurité</h2>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    Change ton mot de passe.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </button>
            </div>

            <div className="grid gap-3 sm:max-w-sm">
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
              />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
              />
              <input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
              />
            </div>

            {securityError ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{securityError}</p> : null}
            {securityOk ? <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{securityOk}</p> : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={changePassword}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
              >
                Changer le mot de passe
              </button>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
              >
                Annuler
              </button>
            </div>

            <div className="mt-8 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Session
              </p>
              <button
                type="button"
                onClick={() => logout()}
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/45"
              >
                Se déconnecter
              </button>
            </div>
          </GlassPanel>
        )}

        {tab === 'friends' && (
          <GlassPanel className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Amis</h2>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    Rechercher, demander, accepter.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </button>
            </div>

            <div className="mt-3 flex max-w-sm flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={friendSearchInput}
                onChange={(e) => setFriendSearchInput(e.target.value)}
                placeholder="Rechercher un pseudo"
                className="w-full rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={searchUsers}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
              >
                Rechercher
              </button>
            </div>

            {friendSearchResults.length > 0 ? (
              <div className="mt-4 max-w-md space-y-2">
                {friendSearchResults.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white/60 p-3 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/70 dark:bg-zinc-950/35"
                  >
                    <div className="flex items-center gap-2">
                      <img src={avatarIdToSrc(candidate.avatarUrl)} alt={candidate.username} className="h-8 w-8 rounded-full" />
                      <a
                        href={'/user/' + candidate.id}
                        className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {candidate.username}
                      </a>
                    </div>
                    {friendIds.has(candidate.id) ? (
                      <span className="rounded-lg bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                        Déjà ami
                      </span>
                    ) : pendingSentIds.has(candidate.id) ? (
                      <span className="rounded-lg bg-amber-200 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                        En attente
                      </span>
                    ) : pendingReceivedIds.has(candidate.id) ? (
                      <span className="rounded-lg bg-sky-200 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/50 dark:text-sky-200">
                        T&apos;a ajouté
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendRequest(candidate.id)}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Ajouter
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {socialError ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{socialError}</p> : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Demandes reçues</p>
                <div className="space-y-2">
                  {pendingReceived.map((p) => (
                    <div
                      key={p.userId}
                      className="rounded-2xl border border-zinc-200/80 bg-white/60 p-3 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
                    >
                      <a href={'/user/' + p.userId} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        {p.username}
                      </a>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => acceptRequest(p.userId)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          onClick={() => refuseRequest(p.userId)}
                          className="rounded-lg bg-zinc-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                  {!pendingReceived.length ? <p className="text-xs text-zinc-500">Aucune demande</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Demandes envoyées</p>
                <div className="space-y-2">
                  {pendingSent.map((p) => (
                    <div
                      key={p.userId}
                      className="rounded-2xl border border-zinc-200/80 bg-white/60 p-3 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
                    >
                      <a href={'/user/' + p.userId} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        {p.username}
                      </a>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => cancelRequest(p.userId)}
                          className="rounded-lg bg-zinc-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ))}
                  {!pendingSent.length ? <p className="text-xs text-zinc-500">Aucune demande en attente</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Mes amis</p>
                <div className="space-y-2">
                  {friends.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white/60 p-3 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
                    >
                      <img src={avatarIdToSrc(f.avatarUrl)} alt={f.username} className="h-8 w-8 rounded-full" />
                      <a href={'/user/' + f.id} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        {f.username}
                      </a>
                    </div>
                  ))}
                  {!friends.length && !socialLoading ? <p className="text-xs text-zinc-500">Aucun ami pour le moment</p> : null}
                </div>
              </div>
            </div>
          </GlassPanel>
        )}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {mode === 'login' ? 'Connexion' : 'Inscription'}
      </h1>
      <div className="mt-4">
        <a
          href={`${getApiBase()}/auth/google/start`}
          className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Continuer avec Google
        </a>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm flex-col gap-3">
        {mode === 'register' && (
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
            >
              Pseudo
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={mode === 'register'}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
            <p className="mt-3 text-xs font-medium text-zinc-600 dark:text-zinc-300">Avatar (modifiable)</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {AVATAR_PRESETS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`rounded-full p-1 ${
                    selectedAvatar === av.id
                      ? 'ring-2 ring-indigo-500'
                      : 'ring-1 ring-zinc-200 dark:ring-zinc-700'
                  }`}
                >
                  <img src={av.src} alt={av.label} className="h-10 w-10 rounded-full" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            Mot de passe
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }} className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto">
            {mode === 'login' ? 'Créer un compte' : 'Déjà un compte'}
          </button>
        </div>
      </form>
    </section>
  )
}

