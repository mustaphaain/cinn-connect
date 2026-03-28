import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/index.js'
import { films, filmGenres } from '../db/schema.js'
import { eq, isNull } from 'drizzle-orm'

type OmdbSearchMovie = {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

type OmdbSearchResponse = {
  Search?: OmdbSearchMovie[]
  totalResults?: string
  Response: 'True' | 'False'
  Error?: string
}

type OmdbMovieDetails = {
  Response: 'True' | 'False'
  Genre?: string
  Error?: string
}

function readEnvFromFile(filePath: string): Record<string, string> {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const out: Record<string, string> = {}
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const k = trimmed.slice(0, eq).trim()
      const v = trimmed.slice(eq + 1).trim()
      out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function getOmdbKey(): string {
  const keyFromBackend = process.env.OMDB_API_KEY?.trim()
  if (keyFromBackend) return keyFromBackend

  const keyFromFrontendEnv = process.env.VITE_OMDB_API_KEY?.trim()
  if (keyFromFrontendEnv) return keyFromFrontendEnv

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const frontendEnvPath = path.join(__dirname, '../../../frontend/.env')
  const vars = readEnvFromFile(frontendEnvPath)
  const keyFromFile = vars.VITE_OMDB_API_KEY?.trim()
  if (keyFromFile) return keyFromFile

  throw new Error(
    'OMDb key manquante. Mets OMDB_API_KEY dans backend/.env (recommandé). En secours : VITE_OMDB_API_KEY dans frontend/.env pour les anciens setups.'
  )
}

async function searchOmdb(query: string, page: number): Promise<OmdbSearchResponse> {
  const key = getOmdbKey()
  const url = new URL('https://www.omdbapi.com/')
  url.searchParams.set('apikey', key)
  url.searchParams.set('s', query)
  url.searchParams.set('type', 'movie')
  url.searchParams.set('page', String(page))

  const res = await fetch(url.toString())
  const data = (await res.json()) as OmdbSearchResponse
  if (!res.ok) {
    const msg = data?.Error ? String(data.Error) : `HTTP ${res.status}`
    throw new Error(`OMDb ${msg} (${query}, page ${page})`)
  }
  if (data.Response === 'False') {
    const msg = data.Error?.trim() || 'Erreur OMDb'
    throw new Error(`OMDb ${msg} (${query}, page ${page})`)
  }
  return data
}

async function getOmdbDetails(imdbId: string): Promise<OmdbMovieDetails> {
  const key = getOmdbKey()
  const url = new URL('https://www.omdbapi.com/')
  url.searchParams.set('apikey', key)
  url.searchParams.set('i', imdbId)
  url.searchParams.set('plot', 'short')

  const res = await fetch(url.toString())
  const data = (await res.json()) as OmdbMovieDetails
  if (!res.ok) {
    const msg = data?.Error ? String(data.Error) : `HTTP ${res.status}`
    throw new Error(`OMDb ${msg} (details: ${imdbId})`)
  }
  return data
}

function normalizeYear(year: string): string | null {
  const y = year.trim()
  if (!y || y === 'N/A') return null
  return y
}

function normalizePoster(poster: string): string | null {
  const p = poster?.trim()
  if (!p || p === 'N/A') return null
  return p
}

function isQuotaError(msg: string) {
  return /request limit reached/i.test(msg)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  // Seed minimal, cohérent avec le projet: on prend juste les grandes catégories.
  // Si tu veux élargir sans exploser le quota, ajoute des mots ici.
  const queries = ['action', 'drama', 'science fiction', 'comedy', 'horror']
  const maxPagesPerQuery = Number(process.env.SEED_FILMS_MAX_PAGES ?? '1') // par défaut: page 1 seulement
  const delayMs = Number(process.env.SEED_FILMS_DELAY_MS ?? '250')
  const maxDetailsPerRun = Number(process.env.SEED_FILMS_MAX_DETAILS ?? '120')

  const existing = await db.select({ imdbId: films.imdbId }).from(films)
  const known = new Set(existing.map((r) => r.imdbId))
  const discovered = new Map<
    string,
    {
      imdbId: string
      title: string
      poster: string | null
      year: string | null
    }
  >()

  console.log(`[seed_films] Start. Queries: ${queries.length} | pages/query: ${maxPagesPerQuery}`)

  for (const q of queries) {
    for (let page = 1; page <= maxPagesPerQuery; page++) {
      let data: OmdbSearchResponse
      try {
        data = await searchOmdb(q, page)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (isQuotaError(msg)) {
          console.error('[seed_films] Quota OMDb atteint. Stop search pour ce run.')
          break
        }
        console.warn('[seed_films] Search OMDb ignorée:', msg)
        break
      }

      for (const m of data.Search ?? []) {
        if (!m.imdbID) continue
        if (known.has(m.imdbID)) continue
        if (discovered.has(m.imdbID)) continue

        discovered.set(m.imdbID, {
          imdbId: String(m.imdbID),
          title: String(m.Title ?? 'Sans titre'),
          poster: normalizePoster(m.Poster),
          year: normalizeYear(String(m.Year ?? '')),
        })
      }

      await sleep(delayMs)
    }
  }

  const toInsert = Array.from(discovered.values())
  if (toInsert.length === 0) {
    console.log('[seed_films] Aucun nouveau film a inserer.')
  } else {
    console.log(`[seed_films] New movies found: ${toInsert.length}`)
    const chunkSize = 500
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize)
      await db.insert(films).values(chunk).onConflictDoNothing({ target: films.imdbId })
    }
  }

  // Remplir/compléter les genres pour les films sans entrées dans film_genres
  const missingGenresFilms = await db
    .select({ filmId: films.id, imdbId: films.imdbId })
    .from(films)
    .leftJoin(filmGenres, eq(filmGenres.filmId, films.id))
    .where(isNull(filmGenres.genre))

  console.log(`[seed_films] Films sans genres: ${missingGenresFilms.length}`)
  console.log(`[seed_films] Limite de details (par run): ${maxDetailsPerRun}`)

  let detailsFetched = 0
  for (const row of missingGenresFilms) {
    if (detailsFetched >= maxDetailsPerRun) break

    let details: OmdbMovieDetails
    try {
      details = await getOmdbDetails(row.imdbId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (isQuotaError(msg)) {
        console.error('[seed_films] Quota OMDb atteint sur details. Stop details pour ce run.')
        break
      }
      console.warn('[seed_films] Details OMDb ignorés:', msg)
      await sleep(delayMs)
      continue
    }

    if (details.Response !== 'True') {
      await sleep(delayMs)
      continue
    }
    const genreStr = details.Genre?.trim()
    if (!genreStr || genreStr === 'N/A') {
      await sleep(delayMs)
      continue
    }

    const genres = genreStr
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean)

    if (!genres.length) {
      await sleep(delayMs)
      continue
    }

    await db
      .insert(filmGenres)
      .values(genres.map((g) => ({ filmId: row.filmId, genre: g })))
      .onConflictDoNothing({ target: [filmGenres.filmId, filmGenres.genre] })

    detailsFetched += 1

    await sleep(delayMs)
  }

  console.log('[seed_films] Done.')
}

export async function seedFilms() {
  await run()
}

const isMain =
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  seedFilms()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed_films] Erreur:', err)
      process.exit(1)
    })
}

