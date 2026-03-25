import 'dotenv/config'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { and, inArray, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { films, reviews, users } from '../db/schema.js'

type Bot = {
  email: string
  username: string
}

const BOT_COUNT = 30

const BOTS: Bot[] = Array.from({ length: BOT_COUNT }, (_, i) => {
  const idx = i + 1
  return { email: `bot${idx}@fake.local`, username: `Bot ${idx}` }
})

function stableHashToInt(input: string): number {
  const hash = crypto.createHash('sha256').update(input).digest()
  // Convertit les 4 premiers octets en entier (0..2^32-1)
  return hash.subarray(0, 4).reduce((acc, b) => acc * 256 + b, 0)
}

function rating10FromImdbId(imdbId: string, botIndex: number): number {
  // Note déterministe en 1..10
  const n = stableHashToInt(`${imdbId}|bot:${botIndex}`)
  return (n % 10) + 1
}

function votesCountFromImdbId(imdbId: string): number {
  // Nombre de votes déterministe entre 7 et 15 inclus.
  const n = stableHashToInt(`${imdbId}|votes`)
  return 7 + (n % 9) // 0..8 => 7..15
}

async function ensureBots(): Promise<number[]> {
  const existing = await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.email, BOTS.map((b) => b.email)))

  const byEmail = new Map(existing.map((r) => [r.email, r.id]))
  const toInsert = BOTS.filter((b) => !byEmail.has(b.email))

  if (toInsert.length > 0) {
    const inserted = await db.insert(users).values(
      toInsert.map((b) => ({
        email: b.email,
        username: b.username,
        passwordHash: null,
        googleId: null,
        avatarUrl: null,
      }))
    ).returning({ id: users.id, email: users.email })

    inserted.forEach((r) => byEmail.set(r.email, r.id))
  }

  return BOTS.map((b) => byEmail.get(b.email)!).filter((id): id is number => typeof id === 'number')
}

async function run() {
  const filmRows = await db.select({ id: films.id, imdbId: films.imdbId }).from(films)
  if (filmRows.length === 0) {
    console.log('[fake_rating] Aucun film trouvé dans la DB.')
    return
  }

  const botIds = await ensureBots()
  console.log(`[fake_rating] Films: ${filmRows.length} | Bots: ${botIds.length}`)

  const filmIds = filmRows.map((f) => f.id)
  const existing = await db
    .select({ userId: reviews.userId, filmId: reviews.filmId })
    .from(reviews)
    .where(and(inArray(reviews.userId, botIds), inArray(reviews.filmId, filmIds)))

  const existingSet = new Set(existing.map((r) => `${r.userId}:${r.filmId}`))

  const toInsert: Array<{
    userId: number
    filmId: number
    rating: number
    comment: string | null
  }> = []

  for (const film of filmRows) {
    const votesNeeded = votesCountFromImdbId(film.imdbId)

    // Construire une liste déterministe des bots candidats, puis prendre les `votesNeeded` premiers.
    const candidates: Array<{ userId: number; botIndex: number; sortKey: number }> = []
    for (let botIndex = 0; botIndex < botIds.length; botIndex++) {
      const userId = botIds[botIndex]
      const sortKey = stableHashToInt(`${film.imdbId}|bot:${botIndex}`)
      candidates.push({ userId, botIndex, sortKey })
    }

    candidates.sort((a, b) => a.sortKey - b.sortKey)
    const selected = candidates.slice(0, votesNeeded)

    for (const selectedBot of selected) {
      const key = `${selectedBot.userId}:${film.id}`
      if (existingSet.has(key)) continue

      const rating = rating10FromImdbId(film.imdbId, selectedBot.botIndex)

      toInsert.push({
        userId: selectedBot.userId,
        filmId: film.id,
        rating,
        comment: null,
      })
    }
  }

  console.log(`[fake_rating] Avis à insérer: ${toInsert.length}`)
  if (toInsert.length === 0) return

  // Insertion en chunks pour éviter des requêtes trop grosses.
  const CHUNK = 500
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK)
    await db.insert(reviews).values(chunk).execute()
  }

  console.log('[fake_rating] Done.')
}

export async function seedFakeRatings() {
  await run()
}

// Ne sort (process.exit) que si le script est lancé directement.
const isMain =
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  seedFakeRatings()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[fake_rating] Erreur:', err)
      process.exit(1)
    })
}

