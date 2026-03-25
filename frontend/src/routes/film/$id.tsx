import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getMovieById } from '../../lib/omdb'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export const Route = createFileRoute('/film/$id')({
  component: FilmDetailsPage,
})

function Stars({
  value,
  onChange,
  disabled,
}: {
  value: number | null // 0..5
  onChange?: (stars: number) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value ?? 0

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const stars = i + 1
        const isFull = display >= stars
        const isHalf = !isFull && display >= stars - 0.5

        const emptyColor = 'text-zinc-400 dark:text-zinc-600'
        const filledColor = 'text-amber-500'

        return (
          <button
            key={stars}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHover(stars)}
            onMouseLeave={() => !disabled && setHover(null)}
            onClick={() => onChange?.(stars)}
            aria-label={`Noter: ${stars} / 5`}
            className={`relative h-6 w-6 p-0 text-lg leading-none transition ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <span className="relative inline-flex h-6 w-6 items-center justify-center">
              <span className={`absolute inset-0 flex items-center justify-center ${emptyColor}`}>★</span>
              {(isFull || isHalf) && (
                <span
                  className={`absolute inset-0 flex items-center justify-center ${filledColor}`}
                  style={
                    isHalf
                      ? ({ clipPath: 'inset(0 50% 0 0)' } as React.CSSProperties)
                      : undefined
                  }
                >
                  ★
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function FilmDetailsPage() {
  const { id } = Route.useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  function toStarsFromRating10(rating10: number): number {
    // Backend: 1..10 => UI: 1..5 (avec demi-étoiles possibles)
    return Math.round(((rating10 / 2) * 2)) / 2
  }

  const query = useQuery({
    queryKey: ['omdb', 'movie', id],
    queryFn: () => getMovieById(id),
  })

  const ratingSummaryQuery = useQuery({
    queryKey: ['reviews', 'summary', id],
    queryFn: () => api.reviews.summaryByFilm(id),
    enabled: !!id,
  })

  const myRatingQuery = useQuery({
    queryKey: ['reviews', 'me', id],
    queryFn: () => api.reviews.myByFilm(id),
    enabled: !!user && !!id,
  })

  const rateMutation = useMutation({
    mutationFn: (rating: number) =>
      api.reviews.rateFilm({
        imdbId: id,
        title: query.data?.Title ?? 'Sans titre',
        poster: query.data?.Poster ?? null,
        year: query.data?.Year ?? null,
        rating,
        comment: null,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reviews', 'summary', id] }),
        queryClient.invalidateQueries({ queryKey: ['reviews', 'me', id] }),
      ])
    },
  })

  const averageStars =
    ratingSummaryQuery.data?.average != null ? toStarsFromRating10(ratingSummaryQuery.data.average) : null

  const myStars = myRatingQuery.data?.rating != null ? toStarsFromRating10(myRatingQuery.data.rating) : null

  const error = query.error instanceof Error ? query.error.message : undefined
  const movie = query.data && query.data.Response === 'True' ? query.data : undefined
  const apiError = query.data && query.data.Response === 'False' ? query.data.Error : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/films"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          ← Films
        </Link>
      </div>

      {query.isLoading && <div className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</div>}

      {(error || apiError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error ?? apiError}
        </div>
      )}

      {movie && (
        <section className="relative grid gap-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[280px_1fr]">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 blur-2xl" />
          <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {movie.Poster && movie.Poster !== 'N/A' ? (
              <img src={movie.Poster} alt={movie.Title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                Pas d’affiche
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {movie.Title}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {movie.Year}
                {movie.Runtime ? ` • ${movie.Runtime}` : ''}
                {movie.Genre ? ` • ${movie.Genre}` : ''}
              </p>
            </div>

            {movie.Plot && <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{movie.Plot}</p>}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-zinc-700 dark:text-zinc-200">
                    <span className="font-semibold">Moyenne</span>{' '}
                    {ratingSummaryQuery.data?.average != null ? (
                      <span className="font-semibold">
                        {(ratingSummaryQuery.data.average / 2).toFixed(1)} / 5
                      </span>
                    ) : (
                      <span className="font-semibold">—</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {ratingSummaryQuery.data?.votes != null ? `${ratingSummaryQuery.data.votes} vote(s)` : ' '}
                  </div>
                </div>
                <div className="shrink-0">
                  <Stars
                    value={averageStars}
                    disabled
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-zinc-700 dark:text-zinc-200">
                  <span className="font-semibold">Votre note</span>{' '}
                  {!user ? <span className="text-zinc-500">(connecte-toi pour voter)</span> : null}
                </div>
                <div className="mt-2">
                  <Stars
                    value={myStars}
                    disabled={!user || rateMutation.isPending || !movie}
                    onChange={(stars) => {
                      // Le backend stocke une note 1..10 ; on convertit 1..5 étoiles -> 2..10.
                      const rating10 = stars * 2
                      rateMutation.mutate(rating10)
                    }}
                  />
                </div>
              </div>
            </div>

            <dl className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              {movie.Director && (
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-zinc-600 dark:text-zinc-400">Réalisateur</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{movie.Director}</dd>
                </div>
              )}
              {movie.Actors && (
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-zinc-600 dark:text-zinc-400">Acteurs</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{movie.Actors}</dd>
                </div>
              )}
              {movie.imdbRating && (
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-zinc-600 dark:text-zinc-400">IMDb</dt>
                  <dd className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    {movie.imdbRating}
                  </dd>
                </div>
              )}
              {movie.Ratings?.length ? (
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-zinc-600 dark:text-zinc-400">Notes</dt>
                  <dd className="flex flex-wrap gap-2">
                    {movie.Ratings.slice(0, 3).map((r) => (
                      <span
                        key={r.Source}
                        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                      >
                        {r.Source}: {r.Value}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>
      )}
    </div>
  )
}

