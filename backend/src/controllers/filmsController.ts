import type { Request, Response } from 'express'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { filmGenres, films } from '../db/schema.js'

function parseGenres(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean)
  }
  const value = typeof raw === 'string' ? raw : ''
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parsePositiveInt(value: unknown, fallback: number) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.floor(n)
}

export async function getFilmsByGenre(req: Request, res: Response) {
  const genres = parseGenres(req.query.genres)
  if (!genres.length) {
    return res.json({ Search: [], totalResults: '0', Response: 'True' })
  }

  const limit = Math.min(50, Math.max(1, parsePositiveInt(req.query.limit, 10)))
  const offset = Math.max(0, parsePositiveInt(req.query.offset, 0))

  const list = await db
    .select({
      Title: films.title,
      Year: sql<string>`COALESCE(${films.year}, '')`,
      imdbID: films.imdbId,
      Poster: sql<string>`COALESCE(${films.poster}, 'N/A')`,
    })
    .from(filmGenres)
    .innerJoin(films, eq(filmGenres.filmId, films.id))
    .where(inArray(filmGenres.genre, genres))
    .orderBy(sql`${films.id} DESC`)
    .limit(limit)
    .offset(offset)

  res.json({
    Search: list,
    totalResults: String(list.length),
    Response: 'True',
  })
}

