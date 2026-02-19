import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { searchMovies } from '../../lib/omdb'

export const Route = createFileRoute('/films/$categorie')({
  component: FilmsByCategoryPage,
})

function FilmsByCategoryPage() {
  const { categorie } = Route.useParams()

  const query = useQuery({
    queryKey: ['omdb', 'category', categorie],
    queryFn: () => searchMovies(categorie.replace('-', ' ')),
  })

  const error = query.error instanceof Error ? query.error.message : undefined
  const items = query.data?.Search ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Catégorie : <span className="capitalize">{categorie.replace('-', ' ')}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            OMDb ne fournit pas de vraies catégories : on utilise une recherche par mot-clé.
          </p>
        </div>
        <Link
          to="/films"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Retour
        </Link>
      </div>

      {query.isLoading && <div className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</div>}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <Link
            key={m.imdbID}
            to="/film/$id"
            params={{ id: m.imdbID }}
            className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-800/60"
          >
            <div className="aspect-[2/3] w-full bg-zinc-100 dark:bg-zinc-800">
              {m.Poster && m.Poster !== 'N/A' ? (
                <img src={m.Poster} alt={m.Title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                  Pas d’affiche
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="line-clamp-2 text-sm font-semibold group-hover:underline">{m.Title}</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{m.Year}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

