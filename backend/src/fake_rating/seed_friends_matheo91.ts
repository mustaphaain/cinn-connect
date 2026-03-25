import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { and, eq, or } from 'drizzle-orm'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/index.js'
import { friends, users } from '../db/schema.js'

const FRIEND_USERNAME = 'matheo__91'
const FRIEND_PASSWORD = 'Test1234!'

const BOT_FRIENDS = [
  { username: 'bot_friend_1', email: 'bot_friend_1@fake.local' },
  { username: 'bot_friend_2', email: 'bot_friend_2@fake.local' },
  { username: 'bot_friend_3', email: 'bot_friend_3@fake.local' },
]

export async function seedFriendsMatheo91() {
  async function getUserIdByUsername(username: string): Promise<number | null> {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
    return rows[0]?.id ?? null
  }

  async function getExistingBotsByEmails(emails: string[]) {
    return db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(or(...emails.map((email) => eq(users.email, email))))
  }

  const matheoId = await getUserIdByUsername(FRIEND_USERNAME)

  if (!matheoId) {
    console.log(`[seed_friends] Compte introuvable: ${FRIEND_USERNAME}`)
    return
  }

  const botEmails = BOT_FRIENDS.map((b) => b.email)
  const existingBots = await getExistingBotsByEmails(botEmails)

  const botByEmail = new Map(existingBots.map((r) => [r.email, r.id] as const))

  const toInsert = BOT_FRIENDS.filter((b) => !botByEmail.has(b.email))
  if (toInsert.length > 0) {
    const passwordHash = await bcrypt.hash(FRIEND_PASSWORD, 10)
    const inserted = await db
      .insert(users)
      .values(
        toInsert.map((b) => ({
          email: b.email,
          username: b.username,
          passwordHash,
          avatarUrl: null,
          googleId: null,
        }))
      )
      .returning({ id: users.id, email: users.email })

    inserted.forEach((r) => botByEmail.set(r.email, r.id))
  }

  const botIds = BOT_FRIENDS.map((b) => botByEmail.get(b.email)).filter((x): x is number => typeof x === 'number')

  // Ajoute la relation accepted si elle n'existe pas déjà (dans un sens ou dans l'autre).
  let added = 0
  for (const botId of botIds) {
    const already = await db
      .select({ id: friends.userId })
      .from(friends)
      .where(
        and(
          or(
            and(eq(friends.userId, matheoId), eq(friends.friendId, botId)),
            and(eq(friends.userId, botId), eq(friends.friendId, matheoId)),
          ),
          eq(friends.status, 'accepted'),
        ),
      )
      .limit(1)

    if (already.length > 0) continue

    await db.insert(friends).values({ userId: matheoId, friendId: botId, status: 'accepted' })
    added += 1
  }

  console.log(`[seed_friends] Ok. Bots créés/attachés. Ajoutés: ${added}`)
}

const isMain =
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  seedFriendsMatheo91()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('[seed_friends] Erreur:', e)
      process.exit(1)
    })
}

