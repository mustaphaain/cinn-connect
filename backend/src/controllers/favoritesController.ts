import type { Request, Response } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { favorites, films } from '../db/schema.js'

async function getFilmByImdbId(imdbId: string) {
  const [film] = await db.select().from(films).where(eq(films.imdbId, imdbId))
  return film
}

export async function listFavorites(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
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
}

export async function isFavorite(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const imdbId = String(req.params.imdbId)

  const rows = await db
    .select({ ok: favorites.filmId })
    .from(favorites)
    .innerJoin(films, eq(favorites.filmId, films.id))
    .where(and(eq(favorites.userId, userId), eq(films.imdbId, imdbId)))
    .limit(1)

  res.json({ favorite: rows.length > 0 })
}

export async function addFavorite(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const { imdbId, title, poster, year } = req.body ?? {}
  if (!imdbId) return res.status(400).json({ error: 'imdbId requis' })

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

  await db.insert(favorites).values({ userId, filmId: film.id }).onConflictDoNothing()
  res.status(201).json({ ok: true })
}

export async function removeFavorite(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const imdbId = String(req.params.imdbId)

  const film = await getFilmByImdbId(imdbId)
  if (!film) return res.json({ ok: true })

  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.filmId, film.id)))
  res.json({ ok: true })
}

