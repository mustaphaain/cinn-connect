import { createFileRoute, Link } from '@tanstack/react-router'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { searchMovies } from '../../lib/omdb'
import type { OmdbSearchMovie, OmdbSearchResponse } from '../../lib/omdb'
import { useMemo, useState } from 'react'
import CircularGallery from '../../components/CircularGallery'
import { getBestPosterUrl } from '../../lib/poster'

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

const MIN_SEARCH_LEN = 2
const MAX_OMDB_PAGES = 10

function hasPoster(movie: OmdbSearchMovie) {
  return Boolean(movie.Poster && movie.Poster !== 'N/A')
}

function extractYear(value: string): number {
  const match = value.match(/\d{4}/)
  return match ? Number(match[0]) : 0
}

function sortByRecent(movies: OmdbSearchMovie[]) {
  return [...movies].sort((a, b) => extractYear(b.Year) - extractYear(a.Year))
}

function flattenUnique(pages: OmdbSearchResponse[] | undefined) {
  const map = new Map<string, OmdbSearchMovie>()
  for (const p of pages ?? []) {
    for (const m of p.Search ?? []) {
      if (!map.has(m.imdbID)) map.set(m.imdbID, m)
    }
  }
  return Array.from(map.values())
}

function MovieCard({
  movie,
  onPosterError,
  compact = false,
}: {
  movie: OmdbSearchMovie
  onPosterError?: (id: string) => void
  compact?: boolean
}) {
  return (
    <Link
      to="/film/$id"
      params={{ id: movie.imdbID }}
      className={`group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-800/60 ${
        compact ? 'w-36 shrink-0 sm:w-44' : ''
      }`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={getBestPosterUrl(movie.Poster, 'card') ?? movie.Poster}
          alt={movie.Title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => onPosterError?.(movie.imdbID)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
          {movie.Title}
        </div>
        <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{movie.Year}</div>
      </div>
    </Link>
  )
}

function FilmsPage() {
  const [q, setQ] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [brokenPosters, setBrokenPosters] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories.map((c) => c.slug))
  const qTrim = q.trim()
  const searchActive = qTrim.length >= MIN_SEARCH_LEN

  const searchQuery = useInfiniteQuery({
    queryKey: ['omdb', 'search', qTrim],
    queryFn: ({ pageParam = 1 }) => searchMovies(qTrim, pageParam),
    enabled: searchActive,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || typeof lastPage !== 'object') return undefined
      const pagesCount = Array.isArray(allPages) ? allPages.filter(Boolean).length : 0
      const pageSize = Array.isArray((lastPage as OmdbSearchResponse).Search)
        ? (lastPage as OmdbSearchResponse).Search!.length
        : 0
      if (pageSize < 10) return undefined
      const nextPage = pagesCount + 1
      return nextPage <= MAX_OMDB_PAGES ? nextPage : undefined
    },
  })

  const categoryQueries = useQueries({
    queries: categories.map((c) => ({
      queryKey: ['omdb', 'category', c.slug],
      queryFn: () => searchMovies(c.search),
      enabled: !searchActive,
    })),
  })

  const byCategory = useMemo(() => {
    const selected = new Set(selectedCategories)
    return categories.map((c, i) => {
      const base = categoryQueries[i]?.data?.Search ?? []
      const filtered = base.filter((m) => hasPoster(m) && !brokenPosters.has(m.imdbID))
      const list = sortByRecent(filtered)
      return { ...c, enabled: selected.has(c.slug), items: list }
    })
  }, [categoryQueries, brokenPosters, selectedCategories])

  const searchItems = useMemo(() => {
    const flat = flattenUnique(searchQuery.data?.pages)
    const filtered = flat.filter((m) => hasPoster(m) && !brokenPosters.has(m.imdbID))
    return sortByRecent(filtered)
  }, [searchQuery.data?.pages, brokenPosters])

  const trendingRecent = useMemo(() => {
    const dedup = new Map<string, OmdbSearchMovie>()
    for (const cat of byCategory) {
      if (!cat.enabled) continue
      for (const m of cat.items) {
        if (!dedup.has(m.imdbID)) dedup.set(m.imdbID, m)
      }
    }
    return sortByRecent(Array.from(dedup.values())).slice(0, 20)
  }, [byCategory])

  const galleryItems = useMemo(() => {
    return trendingRecent
      .filter((m) => hasPoster(m))
      .slice(0, 12)
      .map((m) => ({
        image: getBestPosterUrl(m.Poster, 'gallery') ?? m.Poster,
        text: m.Title,
      }))
  }, [trendingRecent])

  const isLoading = searchActive ? searchQuery.isLoading : categoryQueries.some((r) => r.isLoading)
  const error = (searchActive ? searchQuery.error : categoryQueries.find((r) => r.error)?.error) as Error | undefined
  const errorMessage = error instanceof Error ? error.message : undefined

  const markPosterBroken = (id: string) => {
    setBrokenPosters((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  return (
    <div className="space-y-6">
      {galleryItems.length > 0 ? (
        <div
          className={`overflow-hidden transition-[max-height,opacity,transform,margin] duration-700 ease-in-out ${
            isSearchFocused
              ? 'pointer-events-none -mt-8 max-h-0 -translate-y-24 opacity-0'
              : 'mt-0 max-h-[520px] translate-y-0 opacity-100'
          }`}
          aria-hidden={isSearchFocused}
        >
          <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
            <div className="relative h-[320px] sm:h-[420px]">
              <CircularGallery
                items={galleryItems}
                bend={0}
                borderRadius={0.04}
                textColor="#e4e4e7"
                font="600 18px Inter"
                scrollSpeed={2.2}
                scrollEase={0.06}
              />
            </div>
          </section>
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-2xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Films
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {searchActive
                ? 'Résultats de recherche (catalogue OMDb paginé)'
                : qTrim.length > 0
                  ? `Saisis au moins ${MIN_SEARCH_LEN} caractères pour lancer la recherche.`
                  : 'Parcours les catégories en mode streaming.'}{' '}
              Affiches invalides filtrées automatiquement.
            </p>
          </div>

          <form
            className="flex w-full max-w-md flex-col items-stretch gap-2 sm:flex-row sm:items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Rechercher un film…"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-indigo-600/20 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:ring-fuchsia-500/15"
            />
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategories(categories.map((c) => c.slug))}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Tout afficher
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggleCategory(c.slug)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                selectedCategories.includes(c.slug)
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-200'
                  : 'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <span className={`text-white ${c.className} bg-clip-text text-transparent`}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {isLoading && (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</div>
        )}
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        {searchActive ? (
          <>
            {!isLoading && !errorMessage && searchItems.length === 0 ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-300">Aucun résultat avec affiche valide.</div>
            ) : null}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {searchItems.map((m) => (
                <MovieCard key={m.imdbID} movie={m} onPosterError={markPosterBroken} />
              ))}
            </div>
            {searchQuery.hasNextPage ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => searchQuery.fetchNextPage()}
                  disabled={searchQuery.isFetchingNextPage}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  {searchQuery.isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-6">
            {trendingRecent.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Sorties récentes
                  </h2>
                </div>
                <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                  {trendingRecent.map((m) => (
                    <MovieCard key={`recent-${m.imdbID}`} movie={m} compact onPosterError={markPosterBroken} />
                  ))}
                </div>
              </section>
            ) : null}

            {byCategory.filter((cat) => cat.enabled).map((cat) => (
              <section key={cat.slug} className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {cat.label}
                  </h2>
                  <Link
                    to="/films/$categorie"
                    params={{ categorie: cat.slug }}
                    className="text-xs font-semibold uppercase tracking-wider text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Voir tout
                  </Link>
                </div>
                {cat.items.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Aucun film avec affiche valide.</p>
                ) : (
                  <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                    {cat.items.map((m) => (
                      <MovieCard
                        key={`${cat.slug}-${m.imdbID}`}
                        movie={m}
                        compact
                        onPosterError={markPosterBroken}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

