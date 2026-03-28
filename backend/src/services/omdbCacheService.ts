import { env } from '../config/env.js'
import { HttpError } from '../lib/httpError.js'
import { omdbGetByImdbId, omdbGetByTitleYear, omdbSearch } from '../omdb/client.js'
import { normalizeTitle, searchCacheKey } from '../omdb/normalize.js'
import {
  movieRowToDetails,
  omdbCacheRepository,
} from '../repositories/omdbCacheRepository.js'
import type { OmdbMovieDetails, OmdbSearchResponse } from '../omdb/types.js'

function isStale(updatedAt: Date): boolean {
  const days = env.omdbCacheMaxAgeDays
  if (!days || days <= 0) return false
  const ms = days * 24 * 60 * 60 * 1000
  return Date.now() - updatedAt.getTime() > ms
}

function requireKeyForFreshFetch(): string {
  const k = env.omdbApiKey?.trim()
  if (!k) {
    throw new HttpError(
      503,
      'OMDB_API_KEY manquante sur le serveur. Ajoute-la dans backend/.env pour interroger OMDb. Les réponses déjà en cache peuvent toujours être servies sans clé.',
    )
  }
  return k
}

function tryParseSearch(json: string): OmdbSearchResponse | null {
  try {
    return JSON.parse(json) as OmdbSearchResponse
  } catch {
    return null
  }
}

export const omdbCacheService = {
  async getMovieByImdbId(imdbId: string): Promise<OmdbMovieDetails> {
    const cached = await omdbCacheRepository.findMovieByImdbId(imdbId)

    if (cached && !isStale(cached.updatedAt)) {
      return movieRowToDetails(cached)
    }

    const apiKey = env.omdbApiKey?.trim()

    if (cached && isStale(cached.updatedAt)) {
      if (!apiKey) return movieRowToDetails(cached)
      const raw = await omdbGetByImdbId(apiKey, imdbId)
      if (raw.Response === 'True') {
        await omdbCacheRepository.upsertMovieFromDetail(raw)
        return raw
      }
      return movieRowToDetails(cached)
    }

    if (!apiKey) requireKeyForFreshFetch()
    const raw = await omdbGetByImdbId(apiKey!, imdbId)
    if (raw.Response === 'False') {
      const msg = raw.Error?.trim() || 'Film introuvable sur OMDb.'
      throw new HttpError(404, msg)
    }
    await omdbCacheRepository.upsertMovieFromDetail(raw)
    return raw
  },

  async getMovieByTitleAndYear(title: string, year: string): Promise<OmdbMovieDetails> {
    const titleNorm = normalizeTitle(title)
    const y = year.trim()
    if (!y) throw new HttpError(400, 'Le paramètre year est requis avec title.')

    const cached = await omdbCacheRepository.findMovieByTitleNormAndYear(titleNorm, y)

    if (cached && !isStale(cached.updatedAt)) {
      return movieRowToDetails(cached)
    }

    const apiKey = env.omdbApiKey?.trim()

    if (cached && isStale(cached.updatedAt)) {
      if (!apiKey) return movieRowToDetails(cached)
      const raw = await omdbGetByTitleYear(apiKey, title, y)
      if (raw.Response === 'True') {
        await omdbCacheRepository.upsertMovieFromDetail(raw)
        return raw
      }
      return movieRowToDetails(cached)
    }

    if (!apiKey) requireKeyForFreshFetch()
    const raw = await omdbGetByTitleYear(apiKey!, title, y)
    if (raw.Response === 'False') {
      const msg = raw.Error?.trim() || 'Aucun titre OMDb pour cette combinaison titre / année.'
      throw new HttpError(404, msg)
    }
    await omdbCacheRepository.upsertMovieFromDetail(raw)
    return raw
  },

  async searchMovies(query: string, page: number): Promise<OmdbSearchResponse> {
    const key = searchCacheKey('movie', query, page)
    const hit = await omdbCacheRepository.findSearchPayload(key)
    if (hit) {
      const parsed = tryParseSearch(hit.row.payloadJson)
      if (parsed) {
        const expired = isStale(hit.row.updatedAt)
        if (!expired) return parsed
        if (expired && !env.omdbApiKey?.trim()) return parsed
      }
    }

    const apiKey = requireKeyForFreshFetch()
    const data = await omdbSearch(apiKey, query, page, 'movie')

    if (data.Response === 'False') {
      const message = data.Error?.trim() || 'Aucun résultat OMDb pour cette recherche.'
      if (page > 1 && /not found|incorrect|too many results/i.test(message)) {
        const soft: OmdbSearchResponse = {
          Search: [],
          totalResults: '0',
          Response: 'True',
        }
        await omdbCacheRepository.upsertSearchPayload(key, JSON.stringify(soft))
        return soft
      }
      throw new HttpError(404, message)
    }

    await omdbCacheRepository.upsertSearchPayload(key, JSON.stringify(data))
    return data
  },
}
