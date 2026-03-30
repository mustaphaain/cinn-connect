import { Link } from '@tanstack/react-router'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import type { OmdbSearchMovie, OmdbSearchResponse } from '../../lib/omdb'
import { useMemo, useState } from 'react'
import { getBestPosterUrl } from '../../lib/poster'
import { api } from '../../lib/api'
import { Film, Search } from 'lucide-react'

const categories = [
  { slug: 'action', label: 'Action', search: 'action', className: 'from-amber-500 to-rose-500' },
  { slug: 'drama', label: 'Drame', search: 'drama', className: 'from-indigo-600 to-fuchsia-600' },
  { slug: 'science-fiction', label: 'Science-fiction', search: 'science fiction', className: 'from-cyan-500 to-indigo-600' },
  { slug: 'comedy', label: 'Comédie', search: 'comedy', className: 'from-lime-500 to-emerald-600' },
  { slug: 'horror', label: 'Horreur', search: 'horror', className: 'from-red-600 to-orange-500' },
] as const

const MIN_SEARCH_LEN = 2
const MAX_OMDB_PAGES = 10
const CATEGORY_PREVIEW_COUNT = 12
const SCIENCE_FICTION_PREVIEW_COUNT = 18
const CATEGORY_FETCH_LIMIT = 80

const GENRES_BY_SLUG: Record<string, string[]> = {
  action: ['Action'],
  drama: ['Drama'],
  'science-fiction': ['Sci-Fi', 'Science Fiction'],
  comedy: ['Comedy'],
  horror: ['Horror'],
}

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

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function MovieCard({
  movie,
  onPosterError,
  compact = false,
  dense = false,
}: {
  movie: OmdbSearchMovie
  onPosterError?: (id: string) => void
  compact?: boolean
  dense?: boolean
}) {
  return (
    <Link
      to="/film/$id"
      params={{ id: movie.imdbID }}
      className={cx(
        'group overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40 shadow-2xl shadow-black/40 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-fuchsia-500/30 hover:bg-zinc-950/55',
        'dark:bg-zinc-950/40',
        compact ? (dense ? 'w-28 shrink-0 sm:w-32' : 'w-36 shrink-0 sm:w-44') : ''
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900/40">
        <img
          src={getBestPosterUrl(movie.Poster, 'card') ?? movie.Poster}
          alt={movie.Title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          loading="lazy"
          onError={() => onPosterError?.(movie.imdbID)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-70 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-semibold text-zinc-50 group-hover:underline">
          {movie.Title}
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-tight text-zinc-400">
          {movie.Year}
        </div>
      </div>
    </Link>
  )
}

export function FilmsIndexPage() {
  const [q, setQ] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [brokenPosters, setBrokenPosters] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories.map((c) => c.slug))
  const qTrim = q.trim()
  const searchActive = qTrim.length >= MIN_SEARCH_LEN

  const searchQuery = useInfiniteQuery({
    queryKey: ['api', 'omdb', 'search', qTrim],
    queryFn: ({ pageParam = 1 }) => api.omdb.search(qTrim, pageParam),
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
      queryKey: ['db', 'films', 'by-genre', c.slug],
      queryFn: () => api.films.byGenres(GENRES_BY_SLUG[c.slug], { limit: CATEGORY_FETCH_LIMIT, offset: 0 }),
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

  const featured = useMemo(() => {
    return trendingRecent.find((m) => hasPoster(m) && !brokenPosters.has(m.imdbID)) ?? trendingRecent[0]
  }, [trendingRecent, brokenPosters])

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
    <div className="relative space-y-10">
      <section
        className={cx(
          'relative overflow-hidden group rounded-2xl md:left-1/2 md:w-screen md:-translate-x-1/2 md:rounded-none',
          'transition-[max-height,opacity,transform,margin] duration-700 ease-in-out',
          isSearchFocused ? 'pointer-events-none -mt-6 max-h-0 -translate-y-24 opacity-0' : 'mt-0 max-h-[520px] opacity-100'
        )}
        aria-hidden={isSearchFocused}
      >
        <div className="relative h-[320px] w-full overflow-hidden md:h-[420px]">
          {featured?.Poster ? (
            <img
              alt={featured.Title}
              className="h-full w-full object-cover"
              src={getBestPosterUrl(featured.Poster, 'detail') ?? featured.Poster}
              onError={() => markPosterBroken(featured.imdbID)}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-900/60 via-zinc-950 to-fuchsia-900/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />

          <div className="absolute bottom-10 inset-x-0 px-4 md:inset-x-auto md:left-1/2 md:w-full md:max-w-6xl md:-translate-x-1/2 md:px-8">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">
              À la une cette semaine
            </span>
            <h1 className="font-black tracking-tighter text-3xl leading-none text-zinc-50 md:text-5xl lg:text-6xl">
              {featured?.Title ?? 'Catalogue'}
            </h1>
            <p className="mt-4 line-clamp-2 max-w-lg text-sm text-zinc-300">
              Découvre les sorties récentes et explore par genre. Recherche OMDb disponible dès {MIN_SEARCH_LEN}{' '}
              caractères.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {featured ? (
                <Link
                  to="/film/$id"
                  params={{ id: featured.imdbID }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-300 to-fuchsia-500 px-8 py-3 text-sm font-bold text-zinc-950 transition-transform hover:scale-105 active:scale-95"
                >
                  <Film className="h-4 w-4" />
                  Regarder
                </Link>
              ) : null}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900/70 px-6 py-3 text-sm font-bold text-zinc-50 backdrop-blur-md transition-colors hover:bg-zinc-800/70 active:scale-95"
                onClick={() => {
                  const el = document.getElementById('films-search')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  ;(el as HTMLInputElement | null)?.focus?.()
                }}
              >
                <span className="text-lg">+</span>
                Ma Liste
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-6 relative z-10 md:-mt-14">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/45 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-200" />
              <input
                id="films-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Action, Drame, Nolan..."
                className="w-full rounded-full border border-white/10 bg-zinc-900/50 py-3 pl-12 pr-4 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-indigo-400/20 focus:ring-4"
              />
            </div>

            <div className="flex w-full gap-3 overflow-x-auto pb-2 md:w-auto md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedCategories(categories.map((c) => c.slug))}
                className="shrink-0 rounded-full bg-fuchsia-500/25 px-6 py-2 text-sm font-bold text-fuchsia-200 transition active:scale-95"
              >
                Tout
              </button>
              {categories.map((c) => {
                const active = selectedCategories.includes(c.slug)
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleCategory(c.slug)}
                    className={cx(
                      'shrink-0 rounded-full border px-6 py-2 text-sm font-bold transition active:scale-95',
                      active
                        ? 'border-indigo-400/25 bg-indigo-500/15 text-indigo-200'
                        : 'border-white/10 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100'
                    )}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {isLoading && <div className="text-sm text-zinc-400">Chargement…</div>}
        {errorMessage && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {searchActive ? (
          <>
            {!isLoading && !errorMessage && searchItems.length === 0 ? (
              <div className="text-sm text-zinc-400">Aucun résultat avec affiche valide.</div>
            ) : null}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-zinc-950/40 px-6 py-3 text-sm font-bold text-zinc-50 backdrop-blur-md transition hover:bg-zinc-900/60 disabled:opacity-60"
                >
                  {searchQuery.isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-12">
            {trendingRecent.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-fuchsia-300">
                      Nouveautés
                    </span>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-50">
                      Sorties récentes
                    </h2>
                  </div>
                  <Link
                    to="/films/$categorie"
                    params={{ categorie: 'action' }}
                    className="text-sm font-bold text-indigo-300 hover:underline"
                  >
                    Voir tout
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {trendingRecent.slice(0, 18).map((m) => (
                    <MovieCard key={`recent-${m.imdbID}`} movie={m} onPosterError={markPosterBroken} />
                  ))}
                </div>
              </section>
            ) : null}

            {byCategory
              .filter((cat) => cat.enabled)
              .map((cat) => (
                <section key={cat.slug} className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-fuchsia-300">
                        {cat.slug === 'science-fiction'
                          ? 'Inconnu'
                          : cat.slug === 'action'
                            ? 'Adrénaline'
                            : 'Sélection'}
                      </span>
                      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-50">
                        {cat.label}
                      </h2>
                    </div>
                    <Link
                      to="/films/$categorie"
                      params={{ categorie: cat.slug }}
                      className="text-sm font-bold text-indigo-300 hover:underline"
                    >
                      Voir tout
                    </Link>
                  </div>
                  {cat.items.length === 0 ? (
                    <p className="text-sm text-zinc-400">Aucun film avec affiche valide.</p>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {cat.items
                        .slice(
                          0,
                          cat.slug === 'science-fiction'
                            ? SCIENCE_FICTION_PREVIEW_COUNT
                            : CATEGORY_PREVIEW_COUNT
                        )
                        .map((m) => (
                          <div key={`${cat.slug}-${m.imdbID}`} className="snap-start">
                            <MovieCard movie={m} compact dense onPosterError={markPosterBroken} />
                          </div>
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
