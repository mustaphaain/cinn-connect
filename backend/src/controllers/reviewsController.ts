import type { Request, Response } from 'express'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { films, reviews, users } from '../db/schema.js'

async function getFilmByImdbId(imdbId: string) {
  const [film] = await db.select().from(films).where(eq(films.imdbId, imdbId))
  return film
}

function parsePositiveInt(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function parseRating10(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (n < 1 || n > 10) return null
  return n
}

export async function getMyReviews(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })

  const list = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      filmTitle: films.title,
      filmPoster: films.poster,
      filmImdbId: films.imdbId,
      filmYear: films.year,
    })
    .from(reviews)
    .innerJoin(films, eq(reviews.filmId, films.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt))
  res.json(list)
}

export async function getReviewsByFilm(req: Request, res: Response) {
  const imdbId = String(req.params.imdbId)
  const film = await getFilmByImdbId(imdbId)
  if (!film) return res.json([])

  const list = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      username: users.username,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.filmId, film.id))
    .orderBy(desc(reviews.createdAt))
  res.json(list)
}

export async function getReviewsSummaryByFilm(req: Request, res: Response) {
  const imdbId = String(req.params.imdbId)
  const rows = await db
    .select({
      average: sql<number>`avg(${reviews.rating})`,
      votes: sql<number>`count(${reviews.id})`,
    })
    .from(reviews)
    .innerJoin(films, eq(reviews.filmId, films.id))
    .where(eq(films.imdbId, imdbId))

  const row = rows[0]
  const votes = row ? Number(row.votes ?? 0) : 0
  const average = row && row.average != null ? Number(row.average) : null
  res.json({ average, votes })
}

export async function getMyRatingByFilm(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const imdbId = String(req.params.imdbId)

  const rows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .innerJoin(films, eq(reviews.filmId, films.id))
    .where(and(eq(reviews.userId, userId), eq(films.imdbId, imdbId)))

  res.json({ rating: rows[0]?.rating ?? null })
}

export async function getReviewsByUser(req: Request, res: Response) {
  const userId = parsePositiveInt(req.params.userId)
  if (!userId) return res.status(400).json({ error: 'userId invalide' })
  const limitRaw = Number(req.query.limit ?? 10)
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(30, limitRaw)) : 10

  const list = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      filmTitle: films.title,
      filmPoster: films.poster,
      filmImdbId: films.imdbId,
      filmYear: films.year,
    })
    .from(reviews)
    .innerJoin(films, eq(reviews.filmId, films.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)

  res.json(list)
}

export async function postReview(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const { imdbId, title, poster, year, rating, comment } = req.body
  if (!imdbId || rating == null) return res.status(400).json({ error: 'imdbId et rating requis' })
  const r = parseRating10(rating)
  if (r == null) return res.status(400).json({ error: 'rating entre 1 et 10' })

  let film = await getFilmByImdbId(String(imdbId))
  if (!film) {
    const inserted = await db
      .insert(films)
      .values({
        imdbId: String(imdbId),
        title: title ? String(title) : 'Sans titre',
        poster: poster ? String(poster) : null,
        year: year ? String(year) : null,
      })
      .returning()
    film = inserted[0]
  }

  const existing = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.filmId, film.id)))
  if (existing.length > 0) {
    const [updated] = await db
      .update(reviews)
      .set({ rating: r, comment: comment != null ? String(comment) : null })
      .where(eq(reviews.id, existing[0].id))
      .returning()
    return res.json(updated)
  }

  const [created] = await db
    .insert(reviews)
    .values({ userId, filmId: film.id, rating: r, comment: comment != null ? String(comment) : null })
    .returning()
  res.status(201).json(created)
}

