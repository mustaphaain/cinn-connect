import { Router, Response } from 'express'
import { db } from '../db/index.js'
import { friends, messages, users } from '../db/schema.js'
import { and, desc, eq, isNull, or } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

async function areFriends(userId: number, otherId: number) {
  const rows = await db
    .select({ userId: friends.userId })
    .from(friends)
    .where(
      and(
        or(
          and(eq(friends.userId, userId), eq(friends.friendId, otherId)),
          and(eq(friends.userId, otherId), eq(friends.friendId, userId))
        ),
        eq(friends.status, 'accepted')
      )
    )
    .limit(1)
  return rows.length > 0
}

router.get('/', requireAuth, async (_req, res: Response) => {
  const list = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
      senderId: messages.senderId,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(isNull(messages.recipientId))
    .orderBy(desc(messages.createdAt))
    .limit(50)
  res.json(list.reverse())
})

router.get('/private/:friendId', requireAuth, async (req, res: Response) => {
  const userId = (req as unknown as { userId: number }).userId
  const friendId = Number(req.params.friendId)
  if (!Number.isFinite(friendId) || friendId <= 0 || friendId === userId) {
    res.status(400).json({ error: 'friendId invalide' })
    return
  }
  if (!(await areFriends(userId, friendId))) {
    res.status(403).json({ error: 'Canal privé réservé aux amis' })
    return
  }

  const list = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(
      or(
        and(eq(messages.senderId, userId), eq(messages.recipientId, friendId)),
        and(eq(messages.senderId, friendId), eq(messages.recipientId, userId))
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(100)
  res.json(list.reverse())
})

export default router
