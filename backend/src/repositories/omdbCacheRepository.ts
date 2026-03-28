import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/index.js'

import { omdbMovieCache, omdbSearchCache } from '../db/schema.js'
import type { OmdbMovieDetails } from '../omdb/types.js'
import { normalizeTitle } from '../omdb/normalize.js'

export type MovieCacheRow = typeof omdbMovieCache.$inferSelect
type MovieCacheInsert = typeof omdbMovieCache.$inferInsert

function detailToInsert(data: OmdbMovieDetails): MovieCacheInsert {
  return {
    imdbId: data.imdbID,
    title: data.Title,
    year: data.Year || null,
    titleNorm: normalizeTitle(data.Title),
    rated: data.Rated ?? null,
    released: data.Released ?? null,
    runtime: data.Runtime ?? null,
    genre: data.Genre ?? null,
    director: data.Director ?? null,
    writer: data.Writer ?? null,
    actors: data.Actors ?? null,
    plot: data.Plot ?? null,
    language: data.Language ?? null,
    country: data.Country ?? null,
    awards: data.Awards ?? null,
    poster: data.Poster ?? null,
    ratingsJson: data.Ratings?.length ? JSON.stringify(data.Ratings) : null,
    metascore: data.Metascore ?? null,
    imdbRating: data.imdbRating ?? null,
    imdbVotes: data.imdbVotes ?? null,
    type: data.Type ?? null,
    dvd: data.DVD ?? null,
    boxOffice: data.BoxOffice ?? null,
    production: data.Production ?? null,
    website: data.Website ?? null,
    source: 'omdb',
  }
}

export function movieRowToDetails(row: MovieCacheRow): OmdbMovieDetails {
  let Ratings: OmdbMovieDetails['Ratings']
  if (row.ratingsJson) {
    try {
      Ratings = JSON.parse(row.ratingsJson) as OmdbMovieDetails['Ratings']
    } catch {
      Ratings = undefined
    }
  }
  return {
    Title: row.title,
    Year: row.year ?? '',
    Rated: row.rated ?? undefined,
    Released: row.released ?? undefined,
    Runtime: row.runtime ?? undefined,
    Genre: row.genre ?? undefined,
    Director: row.director ?? undefined,
    Writer: row.writer ?? undefined,
    Actors: row.actors ?? undefined,
    Plot: row.plot ?? undefined,
    Language: row.language ?? undefined,
    Country: row.country ?? undefined,
    Awards: row.awards ?? undefined,
    Poster: row.poster ?? undefined,
    Ratings,
    Metascore: row.metascore ?? undefined,
    imdbRating: row.imdbRating ?? undefined,
    imdbVotes: row.imdbVotes ?? undefined,
    imdbID: row.imdbId,
    Type: row.type ?? undefined,
    DVD: row.dvd ?? undefined,
    BoxOffice: row.boxOffice ?? undefined,
    Production: row.production ?? undefined,
    Website: row.website ?? undefined,
    Response: 'True',
  }
}

export const omdbCacheRepository = {
  async findMovieByImdbId(imdbId: string): Promise<MovieCacheRow | null> {
    const [row] = await db.select().from(omdbMovieCache).where(eq(omdbMovieCache.imdbId, imdbId)).limit(1)
    return row ?? null
  },

  async findMovieByTitleNormAndYear(titleNorm: string, year: string): Promise<MovieCacheRow | null> {
    const [row] = await db
      .select()
      .from(omdbMovieCache)
      .where(and(eq(omdbMovieCache.titleNorm, titleNorm), eq(omdbMovieCache.year, year)))
      .orderBy(desc(omdbMovieCache.updatedAt))
      .limit(1)
    return row ?? null
  },

  async upsertMovieFromDetail(data: OmdbMovieDetails): Promise<void> {
    if (data.Response !== 'True' || !data.imdbID) return
    const now = new Date()
    const insert = detailToInsert(data)
    await db
      .insert(omdbMovieCache)
      .values({ ...insert, cachedAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: omdbMovieCache.imdbId,
        set: {
          title: insert.title,
          year: insert.year,
          titleNorm: insert.titleNorm,
          rated: insert.rated,
          released: insert.released,
          runtime: insert.runtime,
          genre: insert.genre,
          director: insert.director,
          writer: insert.writer,
          actors: insert.actors,
          plot: insert.plot,
          language: insert.language,
          country: insert.country,
          awards: insert.awards,
          poster: insert.poster,
          ratingsJson: insert.ratingsJson,
          metascore: insert.metascore,
          imdbRating: insert.imdbRating,
          imdbVotes: insert.imdbVotes,
          type: insert.type,
          dvd: insert.dvd,
          boxOffice: insert.boxOffice,
          production: insert.production,
          website: insert.website,
          source: insert.source ?? 'omdb',
          updatedAt: now,
        },
      })
  },

  async findSearchPayload(cacheKey: string): Promise<{ row: typeof omdbSearchCache.$inferSelect } | null> {
    const [row] = await db.select().from(omdbSearchCache).where(eq(omdbSearchCache.cacheKey, cacheKey)).limit(1)
    return row ? { row } : null
  },

  async upsertSearchPayload(cacheKey: string, payloadJson: string): Promise<void> {
    const now = new Date()
    await db
      .insert(omdbSearchCache)
      .values({ cacheKey, payloadJson, cachedAt: now, updatedAt: now, source: 'omdb' })
      .onConflictDoUpdate({
        target: omdbSearchCache.cacheKey,
        set: { payloadJson, updatedAt: now, source: 'omdb' },
      })
  },
}
