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

  // Fallback: lire frontend/.env (pour éviter de dupliquer la clé dans backend/.env)
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const frontendEnvPath = path.join(__dirname, '../../../frontend/.env')
  const vars = readEnvFromFile(frontendEnvPath)

  const keyFromFile = vars.VITE_OMDB_API_KEY?.trim()
  if (keyFromFile) return keyFromFile

  throw new Error('OMDb key manquante. Mets OMDB_API_KEY dans backend/.env ou vérifie frontend/.env (VITE_OMDB_API_KEY).')
}

async function searchOmdb(query: string, page = 1): Promise<OmdbSearchMovie[]> {
  const key = getOmdbKey()
  const url = new URL('https://www.omdbapi.com/')
  url.searchParams.set('apikey', key)
  url.searchParams.set('s', query)
  url.searchParams.set('type', 'movie')
  url.searchParams.set('page', String(page))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`OMDb HTTP ${res.status}`)
  const data = (await res.json()) as OmdbSearchResponse
  if (data.Response === 'False') {
    throw new Error(data.Error || `Aucun résultat OMDb pour "${query}"`)
  }
  return data.Search ?? []
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

async function run() {
  // Correspond aux catégories visibles dans `frontend/src/routes/films/$categorie.tsx`
  // (le front fait page=1 par défaut, donc on seed page 1 seulement)
  const queries = ['action', 'drama', 'science fiction', 'comedy', 'horror']

  const existing = await db.select({ imdbId: films.imdbId }).from(films)
  const existingSet = new Set(existing.map((r) => r.imdbId))

  const toInsert: Array<{
    imdbId: string
    title: string
    poster: string | null
    year: string | null
  }> = []

  for (const q of queries) {
    const movies = await searchOmdb(q, 1)
    for (const m of movies) {
      if (!m.imdbID) continue
      if (existingSet.has(m.imdbID)) continue
      toInsert.push({
        imdbId: String(m.imdbID),
        title: String(m.Title ?? 'Sans titre'),
        poster: normalizePoster(m.Poster),
        year: normalizeYear(String(m.Year ?? '')),
      })
      existingSet.add(m.imdbID)
    }
  }

  if (toInsert.length === 0) {
    console.log('[seed_omdb_films] Aucun film à insérer (DB déjà remplie pour ces recherches).')
    return
  }

  const CHUNK = 500
  console.log(`[seed_omdb_films] Insertion ${toInsert.length} films (page 1 par catégorie).`)
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK)
    await db.insert(films).values(chunk).execute()
  }

  console.log('[seed_omdb_films] Done.')
}

export async function seedOmdbFilms() {
  await run()
}

const isMain =
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  seedOmdbFilms()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed_omdb_films] Erreur:', err)
      process.exit(1)
    })
}

