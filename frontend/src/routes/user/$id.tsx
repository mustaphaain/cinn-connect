import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { api, type PublicUser, type ReviewItem } from '../../lib/api'
import { avatarIdToSrc } from '../../lib/avatars'

export const Route = createFileRoute('/user/$id')({
  component: UserPublicProfilePage,
})

function UserPublicProfilePage() {
  const { id } = Route.useParams()
  const userId = Number(id)
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Profil public</h1>
        <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <img
            src={avatarIdToSrc(profile.avatarUrl)}
            alt={profile.username}
            className="h-20 w-20 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <div className="text-sm">
            <p>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Pseudo :</span> {profile.username}
            </p>
            <p>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Amis :</span> {profile.friendsCount}
            </p>
            <p>
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Inscrit le :</span>{' '}
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Derniers avis</h2>
        <div className="mt-3 space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {r.filmTitle} <span className="text-indigo-600 dark:text-indigo-400">({r.rating}/10)</span>
              </p>
              {r.comment ? (
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{r.comment}</p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Pas de commentaire.</p>
              )}
            </article>
          ))}
          {!reviews.length && <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun avis public.</p>}
        </div>
      </div>
    </section>
  )
}

