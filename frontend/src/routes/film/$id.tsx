import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMovieById } from '../../lib/omdb'

export const Route = createFileRoute('/film/$id')({
  component: FilmDetailsPage,
})

function FilmDetailsPage() {
  const { id } = Route.useParams()

  const query = useQuery({
    queryKey: ['omdb', 'movie', id],
    queryFn: () => getMovieById(id),
  })

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
              <div className="flex aspect-[2/3] items-center justify-center text-xs text-zinc-500">
                Pas d’affiche
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{movie.Title}</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {movie.Year}
                {movie.Runtime ? ` • ${movie.Runtime}` : ''}
                {movie.Genre ? ` • ${movie.Genre}` : ''}
              </p>
            </div>

            {movie.Plot && <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{movie.Plot}</p>}

            <dl className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              {movie.Director && (
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-zinc-600 dark:text-zinc-400">Réalisateur</dt>
                  <dd className="font-medium">{movie.Director}</dd>
                </div>
              )}
              {movie.Actors && (
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="text-zinc-600 dark:text-zinc-400">Acteurs</dt>
                  <dd className="font-medium">{movie.Actors}</dd>
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

