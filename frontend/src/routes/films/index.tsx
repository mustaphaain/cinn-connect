import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { searchMovies } from '../../lib/omdb'
import type { OmdbSearchMovie } from '../../lib/omdb'
import { useMemo, useState } from 'react'

const categories = [
  { slug: 'action', label: 'Action', search: 'action', className: 'from-amber-500 to-rose-500' },
  { slug: 'drama', label: 'Drame', search: 'drama', className: 'from-indigo-600 to-fuchsia-600' },
  { slug: 'science-fiction', label: 'Science-fiction', search: 'science fiction', className: 'from-cyan-500 to-indigo-600' },
  { slug: 'comedy', label: 'Comédie', search: 'comedy', className: 'from-lime-500 to-emerald-600' },
  { slug: 'horror', label: 'Horreur', search: 'horror', className: 'from-red-600 to-orange-500' },
] as const

export const Route = createFileRoute('/films/')({
  component: FilmsPage,
})

function FilmsPage() {
  const [q, setQ] = useState('')

  const searchQuery = useQuery({
    queryKey: ['omdb', 'search', q],
    queryFn: () => searchMovies(q),
    enabled: q.trim().length > 0,
  })

  const showAllCategories = q.trim().length === 0
  const categoryQueries = useQueries({
    queries: categories.map((c) => ({
      queryKey: ['omdb', 'category', c.slug],
      queryFn: () => searchMovies(c.search),
      enabled: showAllCategories,
    })),
  })

  const allCategoriesItems = useMemo(() => {
    if (!showAllCategories) return []
    const byId = new Map<string, OmdbSearchMovie>()
    for (const res of categoryQueries) {
      const list = res.data?.Search ?? []
      for (const m of list) {
        if (!byId.has(m.imdbID)) byId.set(m.imdbID, m)
      }
    }
    return Array.from(byId.values())
  }, [showAllCategories, categoryQueries])

  const searchItems = useMemo(() => searchQuery.data?.Search ?? [], [searchQuery.data])
  const items = q.trim().length > 0 ? searchItems : allCategoriesItems
  const isLoading = q.trim().length > 0 ? searchQuery.isLoading : categoryQueries.some((r) => r.isLoading)
  const error = (q.trim().length > 0 ? searchQuery.error : categoryQueries.find((r) => r.error)?.error) as Error | undefined
  const errorMessage = error instanceof Error ? error.message : undefined

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-2xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Films</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {q.trim() ? 'Résultats de recherche' : 'Tous les films (toutes catégories confondues).'} Recherche via OMDb.
            </p>
          </div>

          <form
            className="flex w-full max-w-md items-center gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un film…"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-600/20 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-fuchsia-500/15"
            />
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/films/$categorie"
              params={{ categorie: c.slug }}
              className={`rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900`}
            >
              <span className={`bg-gradient-to-r ${c.className} bg-clip-text text-transparent`}>
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {isLoading && (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</div>
        )}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && items.length === 0 && (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Aucun résultat.</div>
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
                  <img
                    src={m.Poster}
                    alt={m.Title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    Pas d’affiche
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-2 text-sm font-semibold group-hover:underline">
                  {m.Title}
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{m.Year}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

