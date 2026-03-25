import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { and, eq, or } from 'drizzle-orm'
import { db } from './db/index.js'
import { friends, messages, users } from './db/schema.js'
import type { JwtPayload } from './middleware/auth.js'

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-en-prod'
const cookieName = process.env.AUTH_COOKIE_NAME ?? 'cineconnect_auth'

function getCookieValue(cookieHeader: string | undefined, key: string): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(/;\s*/)
  for (const p of parts) {
    const idx = p.indexOf('=')
    if (idx === -1) continue
    const k = p.slice(0, idx)
    if (k === key) return decodeURIComponent(p.slice(idx + 1))
  }
  return null
}

export function setupSocket(io: Server) {
  io.on('connection', async (socket) => {
    const token =
      getCookieValue(socket.handshake.headers.cookie, cookieName) ??
      (socket.handshake.auth.token as string | undefined)
    let userId: number | null = null
    let username = 'Anonyme'
    let avatarUrl: string | null = null
    if (token) {
      try {
        const decoded = jwt.verify(token, secret) as JwtPayload
        userId = decoded.userId
        socket.join('user:' + userId)
        const [u] = await db
          .select({ username: users.username, avatarUrl: users.avatarUrl })
          .from(users)
          .where(eq(users.id, userId))
        if (u) {
          username = u.username
          avatarUrl = u.avatarUrl
        }
      } catch {
        //
      }
    }

    async function areFriends(a: number, b: number) {
      const rows = await db
        .select({ userId: friends.userId })
        .from(friends)
        .where(
          and(
            or(
              and(eq(friends.userId, a), eq(friends.friendId, b)),
              and(eq(friends.userId, b), eq(friends.friendId, a))
            ),
            eq(friends.status, 'accepted')
          )
        )
        .limit(1)
      return rows.length > 0
    }

    socket.on('message', async (content: string) => {
      if (typeof content !== 'string' || !content.trim()) return
      if (!userId) {
        socket.emit('error', { message: 'Connecte-toi pour envoyer un message' })
        return
      }
      const [msg] = await db
        .insert(messages)
        .values({ senderId: userId, content: content.trim().slice(0, 2000), recipientId: null })
        .returning()
      io.emit('message', {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        username,
        avatarUrl,
        senderId: userId,
      })
    })

    socket.on('private:message', async (payload: { toUserId?: number; content?: string }) => {
      if (!userId) {
        socket.emit('error', { message: 'Connecte-toi pour envoyer un message' })
        return
      }
      const toUserId = Number(payload?.toUserId)
      const content = String(payload?.content ?? '').trim()
      if (!Number.isFinite(toUserId) || toUserId <= 0 || toUserId === userId || !content) return
      if (!(await areFriends(userId, toUserId))) {
        socket.emit('error', { message: 'Canal privé réservé aux amis' })
        return
      }
      const [msg] = await db
        .insert(messages)
        .values({ senderId: userId, recipientId: toUserId, content: content.slice(0, 2000) })
        .returning()
      const eventPayload = {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        username,
        avatarUrl,
        senderId: userId,
        recipientId: toUserId,
      }
      io.to('user:' + userId).emit('private:message', eventPayload)
      io.to('user:' + toUserId).emit('private:message', eventPayload)
    })
  })
}
