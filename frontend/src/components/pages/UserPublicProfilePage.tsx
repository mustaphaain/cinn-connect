import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { UserPlus, Users, Calendar, Star, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'
import { api, type PublicUser, type ReviewItem } from '../../lib/api'
import { avatarIdToSrc } from '../../lib/avatars'
import { getBestPosterUrl } from '../../lib/poster'
import { GlassPanel } from '../molecules/GlassPanel'

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function UserPublicProfilePage() {
  const { id } = useParams({ from: '/user/$id' })
  const userId = Number(id)
  const { user: me } = useAuth()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [requestOk, setRequestOk] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set())
  const [pendingSentIds, setPendingSentIds] = useState<Set<number>>(new Set())
  const [pendingReceivedIds, setPendingReceivedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [u, r] = await Promise.all([api.users.getPublic(userId), api.reviews.byUser(userId, 8)])
        if (cancelled) return
        setProfile(u)
        setReviews(r)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Erreur')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    if (!me) {
      setFriendIds(new Set())
      setPendingSentIds(new Set())
      setPendingReceivedIds(new Set())
      return
    }
    api.friends
      .list()
      .then((data) => {
        if (cancelled) return
        setFriendIds(new Set(data.friends.map((f) => f.id)))
        setPendingSentIds(new Set(data.pendingSent.map((p) => p.userId)))
        setPendingReceivedIds(new Set(data.pendingReceived.map((p) => p.userId)))
      })
      .catch(() => {
        if (cancelled) return
        setFriendIds(new Set())
        setPendingSentIds(new Set())
        setPendingReceivedIds(new Set())
      })
    return () => {
      cancelled = true
    }
  }, [me])

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement du profil…</p>
      </section>
    )
  }

  if (error || !profile) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Profil introuvable'}</p>
      </section>
    )
  }

  const createdAtLabel = new Date(profile.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isSelf = me?.id === profile.id
  const isFriend = friendIds.has(profile.id)
  const isPendingSent = pendingSentIds.has(profile.id)
  const isPendingReceived = pendingReceivedIds.has(profile.id)

  const stats = [
    {
      label: 'Amis',
      value: String(profile.friendsCount),
      icon: <Users className="h-4 w-4" />,
      accent: 'from-indigo-500/20 to-fuchsia-500/10 dark:from-indigo-500/15 dark:to-fuchsia-500/10',
    },
    {
      label: 'Avis publiés',
      value: String(reviews.length),
      icon: <Star className="h-4 w-4" />,
      accent: 'from-amber-500/20 to-rose-500/10 dark:from-amber-500/15 dark:to-rose-500/10',
    },
    {
      label: 'Inscrit le',
      value: new Date(profile.createdAt).toLocaleDateString('fr-FR'),
      icon: <Calendar className="h-4 w-4" />,
      accent: 'from-emerald-500/20 to-sky-500/10 dark:from-emerald-500/15 dark:to-sky-500/10',
    },
  ]

  const sendFriendRequest = async () => {
    setRequestOk(null)
    setRequestError(null)
    if (!me) {
      setRequestError('Connecte-toi pour envoyer une demande.')
      return
    }
    if (isSelf) return
    setRequesting(true)
    try {
      await api.friends.request(profile.id)
      setRequestOk('Demande envoyée.')
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <section className="space-y-6">
      <GlassPanel className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/15 to-rose-500/15 blur-2xl" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Profil public
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {profile.username}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Membre depuis <span className="font-medium">{createdAtLabel}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/films"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950/80"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Link>
              {!isSelf ? (
                isFriend ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/60 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur-md opacity-80 dark:border-zinc-700 dark:bg-zinc-950/45 dark:text-zinc-200"
                    aria-disabled="true"
                    title="Vous êtes déjà amis"
                  >
                    <Users className="h-4 w-4" />
                    Déjà ami
                  </button>
                ) : isPendingSent ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 opacity-90 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
                    aria-disabled="true"
                    title="Demande déjà envoyée"
                  >
                    <UserPlus className="h-4 w-4" />
                    En attente
                  </button>
                ) : isPendingReceived ? (
                  <Link
                    to="/profil"
                    search={{ tab: 'friends' }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
                    title="Ouvrir les demandes d'amis"
                  >
                    <Users className="h-4 w-4" />
                    Répondre
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={sendFriendRequest}
                    disabled={requesting}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 dark:ring-white/10"
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter
                  </button>
                )
              ) : (
                <Link
                  to="/profil"
                  search={{ tab: undefined }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
                >
                  Ouvrir mon profil
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={avatarIdToSrc(profile.avatarUrl)}
              alt={profile.username}
              className="h-14 w-14 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Identité
              </p>
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                @{profile.username}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Ce profil est visible publiquement.
              </p>
            </div>
          </div>

          {requestOk ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{requestOk}</p> : null}
          {requestError ? <p className="text-sm text-red-600 dark:text-red-400">{requestError}</p> : null}

          <div className="sm:hidden">
            <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={cx(
                    'snap-start w-44 shrink-0 rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35',
                    'relative overflow-hidden'
                  )}
                >
                  <div className={cx('pointer-events-none absolute inset-0 bg-gradient-to-br', s.accent)} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        {s.label}
                      </p>
                      <p className="mt-1 truncate text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {s.value}
                      </p>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                      {s.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden gap-3 sm:grid sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className={cx(
                  'rounded-2xl border border-zinc-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35',
                  'relative overflow-hidden'
                )}
              >
                <div className={cx('pointer-events-none absolute inset-0 bg-gradient-to-br', s.accent)} />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      {s.label}
                    </p>
                    <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {s.value}
                    </p>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white/60 text-indigo-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-indigo-300">
                    {s.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Derniers avis</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Notes et commentaires récents de {profile.username}.
            </p>
          </div>
        </div>

        {!reviews.length ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Aucun avis public.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/60 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/35"
              >
                <div className="flex gap-3 p-4">
                  <Link to="/film/$id" params={{ id: r.filmImdbId }} className="shrink-0">
                    <div className="h-20 w-14 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                      {r.filmPoster ? (
                        <img
                          src={getBestPosterUrl(r.filmPoster, 'thumb') ?? r.filmPoster}
                          alt={r.filmTitle}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[10px] text-zinc-500 dark:text-zinc-400">
                          N/A
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50" title={r.filmTitle}>
                      {r.filmTitle}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {r.filmYear ?? '—'} ·{' '}
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{r.rating}/10</span>
                    </p>
                    {r.comment ? (
                      <p className="mt-2 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">{r.comment}</p>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Pas de commentaire.</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </GlassPanel>
    </section>
  )
}
