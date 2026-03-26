import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/index.js'
import { films } from '../db/schema.js'

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
    'OMDb key manquante. Mets OMDB_API_KEY dans backend/.env ou VITE_OMDB_API_KEY dans frontend/.env.'
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
  if (!res.ok) throw new Error(`OMDb HTTP ${res.status} (${query}, page ${page})`)
  return (await res.json()) as OmdbSearchResponse
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

function buildQueries(): string[] {
  // Couverture large : alphanumerique + mots frequents cinema
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
  const keywords = [
    'love',
    'war',
    'night',
    'day',
    'life',
    'death',
    'world',
    'man',
    'woman',
    'family',
    'city',
    'house',
    'road',
    'star',
    'dark',
    'light',
    'king',
    'queen',
    'last',
    'first',
    'new',
    'old',
    'action',
    'drama',
    'comedy',
    'horror',
    'thriller',
    'romance',
    'crime',
    'adventure',
    'fantasy',
    'mystery',
    'space',
    'future',
    'past',
  ]
  return [...chars, ...keywords]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  const queries = buildQueries()
  const maxPagesPerQuery = 10 // limite OMDb sur search
  const delayMs = 140 // evite de saturer le quota API

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

  console.log(`[seed_films] Start. Queries: ${queries.length}`)

  for (const q of queries) {
    let pagesToFetch = 1
    for (let page = 1; page <= pagesToFetch && page <= maxPagesPerQuery; page++) {
      const data = await searchOmdb(q, page)

      if (data.Response === 'False') break

      if (page === 1) {
        const total = Number(data.totalResults ?? '0')
        if (Number.isFinite(total) && total > 0) {
          pagesToFetch = Math.min(maxPagesPerQuery, Math.ceil(total / 10))
        }
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
    return
  }

  console.log(`[seed_films] New movies found: ${toInsert.length}`)
  const chunkSize = 500
  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const chunk = toInsert.slice(i, i + chunkSize)
    await db.insert(films).values(chunk).onConflictDoNothing({ target: films.imdbId })
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

