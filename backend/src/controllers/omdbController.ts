import type { Request, Response } from 'express'
import { HttpError } from '../lib/httpError.js'
import { omdbCacheService } from '../services/omdbCacheService.js'

const IMDB_ID_RE = /^tt\d+$/i

export async function searchOmdbMovies(req: Request, res: Response) {
  const s = String(req.query.s ?? '').trim()
  if (!s) throw new HttpError(400, 'Paramètre de requête s (recherche) requis')
  const pageRaw = Number(req.query.page ?? 1)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
  const data = await omdbCacheService.searchMovies(s, page)
  res.json(data)
}

export async function getOmdbMovie(req: Request, res: Response) {
  const imdbId = String(req.params.imdbId ?? '').trim()
  if (!IMDB_ID_RE.test(imdbId)) {
    throw new HttpError(400, 'imdbId invalide (format attendu : tt…)')
  }
  const data = await omdbCacheService.getMovieByImdbId(imdbId)
  res.json(data)
}

export async function getOmdbMovieByTitleYear(req: Request, res: Response) {
  const title = String(req.query.title ?? '').trim()
  const year = String(req.query.year ?? '').trim()
  if (!title || !year) throw new HttpError(400, 'Paramètres title et year requis')
  const data = await omdbCacheService.getMovieByTitleAndYear(title, year)
  res.json(data)
}
