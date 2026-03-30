import type { Request, Response } from 'express'
import { and, desc, eq, isNull, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { friends, messages, users } from '../db/schema.js'

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

export async function listPublicMessages(_req: Request, res: Response) {
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
}

export async function listPrivateMessages(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const friendId = Number(req.params.friendId)
  if (!Number.isFinite(friendId) || friendId <= 0 || friendId === userId) {
    return res.status(400).json({ error: 'friendId invalide' })
  }
  if (!(await areFriends(userId, friendId))) {
    return res.status(403).json({ error: 'Canal privé réservé aux amis' })
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
}

export async function deleteMessage(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })

  const messageId = Number(req.params.id)
  if (!Number.isFinite(messageId) || messageId <= 0) {
    return res.status(400).json({ error: 'id invalide' })
  }

  const deleted = await db
    .delete(messages)
    .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)))
    .returning({ id: messages.id })

  if (deleted.length === 0) {
    return res.status(404).json({ error: 'Message introuvable' })
  }

  res.json({ ok: true })
}

