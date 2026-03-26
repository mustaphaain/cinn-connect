import { Router, Request, Response } from 'express'
import { db } from '../db/index.js'
import { favorites, films } from '../db/schema.js'
import { and, desc, eq } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

async function getFilmByImdbId(imdbId: string) {
  const [film] = await db.select().from(films).where(eq(films.imdbId, imdbId))
  return film
}

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const list = await db
    .select({
      imdbId: films.imdbId,
      title: films.title,
      poster: films.poster,
      year: films.year,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(films, eq(favorites.filmId, films.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))

  res.json(list)
})

router.get('/:imdbId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const imdbId = String(req.params.imdbId)

  const rows = await db
    .select({ ok: favorites.filmId })
    .from(favorites)
    .innerJoin(films, eq(favorites.filmId, films.id))
    .where(and(eq(favorites.userId, userId), eq(films.imdbId, imdbId)))
    .limit(1)

  res.json({ favorite: rows.length > 0 })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const { imdbId, title, poster, year } = req.body ?? {}
  if (!imdbId) {
    res.status(400).json({ error: 'imdbId requis' })
    return
  }

  const id = String(imdbId)
  let film = await getFilmByImdbId(id)
  if (!film) {
    const inserted = await db
      .insert(films)
      .values({
        imdbId: id,
        title: title ? String(title) : 'Sans titre',
        poster: poster ? String(poster) : null,
        year: year ? String(year) : null,
      })
      .returning()
    film = inserted[0]
  }

  await db
    .insert(favorites)
    .values({ userId, filmId: film.id })
    .onConflictDoNothing()

  res.status(201).json({ ok: true })
})

router.delete('/:imdbId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const imdbId = String(req.params.imdbId)

  const film = await getFilmByImdbId(imdbId)
  if (!film) {
    res.json({ ok: true })
    return
  }

  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.filmId, film.id)))
  res.json({ ok: true })
})

export default router

