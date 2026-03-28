import { HttpError } from '../lib/httpError.js'
import type { OmdbMovieDetails, OmdbSearchResponse } from './types.js'

const OMDB_BASE_URL = 'https://www.omdbapi.com/'

async function readJsonBody(res: Response): Promise<unknown> {
  try {
    return await res.clone().json()
  } catch {
    return null
  }
}

export async function omdbFetch<T>(apiKey: string, params: Record<string, string | undefined>): Promise<T> {
  const url = new URL(OMDB_BASE_URL)
  url.searchParams.set('apikey', apiKey)
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString())
  const body = await readJsonBody(res)

  if (!res.ok) {
    const msgFromBody =
      body && typeof body === 'object' && body !== null && 'Error' in body
        ? String((body as Record<string, unknown>).Error ?? '')
        : ''
    if (res.status === 401) {
      if (msgFromBody && /request limit reached/i.test(msgFromBody)) {
        throw new HttpError(
          503,
          'OMDb: quota dépassé. Réessaie plus tard ou change de plan sur omdbapi.com.',
        )
      }
      throw new HttpError(
          502,
          'OMDb: accès refusé (HTTP 401). Vérifie OMDB_API_KEY sur le serveur.',
        )
    }
    throw new HttpError(502, msgFromBody ? `OMDb: ${msgFromBody}` : `OMDb HTTP ${res.status}`)
  }

  return (body ?? (await res.json())) as T
}

export async function omdbSearch(
  apiKey: string,
  query: string,
  page: number,
  type: 'movie' | 'series' | 'episode' = 'movie',
): Promise<OmdbSearchResponse> {
  const s = query.trim()
  return omdbFetch<OmdbSearchResponse>(apiKey, {
    s,
    type,
    page: String(page),
  })
}

export async function omdbGetByImdbId(apiKey: string, imdbId: string): Promise<OmdbMovieDetails> {
  return omdbFetch<OmdbMovieDetails>(apiKey, {
    i: imdbId,
    plot: 'full',
  })
}

export async function omdbGetByTitleYear(
  apiKey: string,
  title: string,
  year: string,
): Promise<OmdbMovieDetails> {
  return omdbFetch<OmdbMovieDetails>(apiKey, {
    t: title.trim(),
    y: year.trim(),
    plot: 'full',
  })
}
