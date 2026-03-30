import { Link, useParams } from '@tanstack/react-router'
import { useQueries } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { OmdbSearchMovie, OmdbSearchResponse } from '../../lib/omdb'
import { getBestPosterUrl } from '../../lib/poster'
import { api } from '../../lib/api'

const MAX_OMDB_PAGES = 10
const OMDB_PAGE_SIZE = 10

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

function parseYear(year: string): number {
  const match = year.match(/\d{4}/)
  return match ? Number(match[0]) : 0
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

export function FilmsByCategoryPage() {
  const { categorie } = useParams({ from: '/films/$categorie' })
  return <FilmsByCategoryInner key={categorie} categorie={categorie} />
}

function FilmsByCategoryInner({ categorie }: { categorie: string }) {
  const [brokenPosters, setBrokenPosters] = useState<Set<string>>(new Set())
  const [pagesToLoad, setPagesToLoad] = useState(1)
  const sortMode: 'recent' | 'oldest' | 'az' | 'za' = 'recent'
  const yearFilter: 'all' | '2000' | '2010' | '2020' = 'all'
  const safeCategorie = typeof categorie === 'string' ? categorie : ''
  const categoryLabel = safeCategorie ? safeCategorie.replace(/-/g, ' ') : 'inconnue'
  const genres = GENRES_BY_SLUG[safeCategorie] ?? []

  const pageQueries = useQueries({
    queries: Array.from({ length: pagesToLoad }, (_, i) => ({
      queryKey: ['db', 'films', 'by-genre', safeCategorie, i + 1],
      queryFn: () =>
        api.films.byGenres(genres, {
          limit: OMDB_PAGE_SIZE,
          offset: i * OMDB_PAGE_SIZE,
        }),
      enabled: genres.length > 0,
    })),
  })

  const error = pageQueries.find((q) => q.error)?.error
  const errorMessage = error instanceof Error ? error.message : undefined
  const missingOmdbKey = Boolean(errorMessage && /OMDB_API_KEY/i.test(errorMessage))

  const pagesData = pageQueries.map((q) => q.data).filter((d): d is OmdbSearchResponse => Boolean(d && typeof d === 'object'))
  const isLoading = pageQueries.some((q) => q.isLoading)
  const isFetchingMore = pageQueries.some((q) => q.isFetching) && !isLoading

  const items = useMemo(() => {
    const flat = flattenUnique(pagesData)
    return flat.filter((m) => hasPoster(m) && !brokenPosters.has(m.imdbID))
  }, [pagesData, brokenPosters])

  const visibleItems = useMemo(() => {
    const minYear = yearFilter === 'all' ? 0 : yearFilter === '2000' ? 2000 : yearFilter === '2010' ? 2010 : 2020
    const filtered = minYear === 0 ? items : items.filter((m) => parseYear(m.Year) >= minYear && parseYear(m.Year) > 0)
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortMode === 'recent') return parseYear(b.Year) - parseYear(a.Year)
      if (sortMode === 'oldest') return parseYear(a.Year) - parseYear(b.Year)
      if (sortMode === 'az') return a.Title.localeCompare(b.Title)
      return b.Title.localeCompare(a.Title)
    })
    return sorted
  }, [items, sortMode, yearFilter])

  const lastPage = pagesData[pagesData.length - 1]
  const lastPageSize = Array.isArray(lastPage?.Search) ? lastPage.Search.length : 0
  const hasMore = pagesData.length > 0 && lastPageSize === 10 && pagesToLoad < MAX_OMDB_PAGES

  const markPosterBroken = (id: string) => {
    setBrokenPosters((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-2xl" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Catégorie : <span className="capitalize">{categoryLabel}</span>
          </h1>
        </div>
        <div className="mt-3">
          <Link to="/films" className="inline-flex w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 md:w-auto">
            Retour
          </Link>
        </div>
      </div>

      {isLoading && <div className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</div>}
      {errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">{errorMessage}</div>}
      {missingOmdbKey ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          Clé OMDb manquante côté serveur. Ajoute `OMDB_API_KEY` dans `backend/.env`, puis redémarre le backend.
        </div>
      ) : null}
      {!isLoading && !errorMessage && visibleItems.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          Aucun film à afficher pour cette catégorie. Si c’est une première installation, lance `pnpm -C backend seed:films`
          pour remplir la base.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {visibleItems.map((m) => (
          <Link key={m.imdbID} to="/film/$id" params={{ id: m.imdbID }} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-800/60">
            <div className="aspect-[2/3] w-full bg-zinc-100 dark:bg-zinc-800">
              <img src={getBestPosterUrl(m.Poster, 'card') ?? m.Poster} alt={m.Title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" onError={() => markPosterBroken(m.imdbID)} />
            </div>
            <div className="p-3">
              <div className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">{m.Title}</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{m.Year}</div>
            </div>
          </Link>
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button type="button" onClick={() => setPagesToLoad((p) => p + 1)} disabled={isFetchingMore} className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
            {isFetchingMore ? 'Chargement…' : 'Charger plus'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

