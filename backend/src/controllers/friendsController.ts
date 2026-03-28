import type { Request, Response } from 'express'
import { and, eq, inArray, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { friends, users } from '../db/schema.js'

export async function listFriends(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })

  const rows = await db
    .select()
    .from(friends)
    .where(or(eq(friends.userId, userId), eq(friends.friendId, userId)))

  const otherIds = Array.from(new Set(rows.map((row) => (row.userId === userId ? row.friendId : row.userId))))
  const others =
    otherIds.length === 0
      ? []
      : await db
          .select({ id: users.id, username: users.username, email: users.email, avatarUrl: users.avatarUrl })
          .from(users)
          .where(inArray(users.id, otherIds))
  const otherById = new Map(others.map((u) => [u.id, u]))

  const accepted: { id: number; username: string; email: string; avatarUrl: string | null }[] = []
  const pendingReceived: { id: number; username: string; userId: number }[] = []
  const pendingSent: { id: number; username: string; userId: number }[] = []
  for (const row of rows) {
    const otherId = row.userId === userId ? row.friendId : row.userId
    const other = otherById.get(otherId)
    if (!other) continue
    if (row.status === 'accepted') {
      accepted.push({ id: other.id, username: other.username, email: other.email, avatarUrl: other.avatarUrl })
    } else if (row.friendId === userId) {
      pendingReceived.push({ id: other.id, username: other.username, userId: other.id })
    } else if (row.userId === userId) {
      pendingSent.push({ id: other.id, username: other.username, userId: other.id })
    }
  }
  res.json({ friends: accepted, pendingReceived, pendingSent })
}

export async function sendFriendRequest(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const friendId = Number(req.body.friendId)
  if (!friendId || friendId === userId) return res.status(400).json({ error: 'friendId invalide' })

  const [other] = await db.select().from(users).where(eq(users.id, friendId))
  if (!other) return res.status(404).json({ error: 'Utilisateur introuvable' })

  const existing1 = await db.select().from(friends).where(and(eq(friends.userId, userId), eq(friends.friendId, friendId)))
  const existing2 = await db.select().from(friends).where(and(eq(friends.userId, friendId), eq(friends.friendId, userId)))
  if (existing1.length > 0 || existing2.length > 0) {
    return res.status(409).json({ error: 'Demande déjà envoyée ou déjà amis' })
  }

  await db.insert(friends).values({ userId, friendId, status: 'pending' })
  res.status(201).json({ message: 'Demande envoyée' })
}

export async function acceptFriendRequest(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const friendId = Number(req.params.friendId)
  const updated = await db
    .update(friends)
    .set({ status: 'accepted' })
    .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId), eq(friends.status, 'pending')))
    .returning()
  if (updated.length === 0) return res.status(404).json({ error: 'Demande non trouvée' })
  res.json(updated[0])
}

export async function refuseFriendRequest(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const friendId = Number(req.params.friendId)
  const deleted = await db
    .delete(friends)
    .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId), eq(friends.status, 'pending')))
    .returning()
  if (deleted.length === 0) return res.status(404).json({ error: 'Demande non trouvée' })
  res.json({ ok: true })
}

export async function cancelFriendRequest(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const friendId = Number(req.params.friendId)
  const deleted = await db
    .delete(friends)
    .where(and(eq(friends.userId, userId), eq(friends.friendId, friendId), eq(friends.status, 'pending')))
    .returning()
  if (deleted.length === 0) return res.status(404).json({ error: 'Demande non trouvée' })
  res.json({ ok: true })
}

