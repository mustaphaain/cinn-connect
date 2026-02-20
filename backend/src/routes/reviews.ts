import { Router, Request, Response } from 'express'
import { db } from '../db/index.js'
import { films, reviews, users } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
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
})

router.get('/film/:imdbId', async (req: Request, res: Response) => {
  const [film] = await db.select().from(films).where(eq(films.imdbId, req.params.imdbId))
  if (!film) {
    res.json([])
    return
  }
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
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const { imdbId, title, poster, year, rating, comment } = req.body
  if (!imdbId || rating == null) {
    res.status(400).json({ error: 'imdbId et rating requis' })
    return
  }
  const r = Number(rating)
  if (r < 1 || r > 10) {
    res.status(400).json({ error: 'rating entre 1 et 10' })
    return
  }
  let [film] = await db.select().from(films).where(eq(films.imdbId, String(imdbId)))
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
    res.json(updated)
    return
  }
  const [created] = await db
    .insert(reviews)
    .values({ userId, filmId: film.id, rating: r, comment: comment != null ? String(comment) : null })
    .returning()
  res.status(201).json(created)
})

export default router
