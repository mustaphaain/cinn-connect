export type OmdbSearchMovie = {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

export type OmdbSearchResponse = {
  Search?: OmdbSearchMovie[]
  totalResults?: string
  Response: 'True' | 'False'
  Error?: string
}

export type OmdbMovieDetails = {
  Title: string
  Year: string
  Rated?: string
  Released?: string
  Runtime?: string
  Genre?: string
  Director?: string
  Writer?: string
  Actors?: string
  Plot?: string
  Language?: string
  Country?: string
  Awards?: string
  Poster?: string
  Ratings?: { Source: string; Value: string }[]
  Metascore?: string
  imdbRating?: string
  imdbVotes?: string
  imdbID: string
  Type?: string
  DVD?: string
  BoxOffice?: string
  Production?: string
  Website?: string
  Response: 'True' | 'False'
  Error?: string
}

const OMDB_BASE_URL = 'https://www.omdbapi.com/'

function getApiKey() {
  const key = (import.meta.env.VITE_OMDB_API_KEY as string | undefined)?.trim()
  if (!key) {
    throw new Error(
      'Clé OMDb manquante. Copie frontend/.env.example vers frontend/.env et renseigne VITE_OMDB_API_KEY (clé sur omdbapi.com). Puis redémarre le serveur Vite (pnpm dev).',
    )
  }
  return key
}

async function omdbFetch<T>(params: Record<string, string | undefined>): Promise<T> {
  const url = new URL(OMDB_BASE_URL)
  url.searchParams.set('apikey', getApiKey())
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v)
  })

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`OMDb HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function searchMovies(query: string, page = 1) {
  const s = query.trim()
  const data = await omdbFetch<OmdbSearchResponse>({
    s,
    type: 'movie',
    page: String(page),
  })
  if (data.Response === 'False') {
    throw new Error(data.Error?.trim() || 'Aucun résultat OMDb pour cette recherche.')
  }
  return data
}

export function getMovieById(imdbId: string) {
  return omdbFetch<OmdbMovieDetails>({
    i: imdbId,
    plot: 'full',
  })
}

