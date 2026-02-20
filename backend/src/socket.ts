import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from './db/index.js'
import { messages, users } from './db/schema.js'
import type { JwtPayload } from './middleware/auth.js'

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-en-prod'

export function setupSocket(io: Server) {
  io.on('connection', async (socket) => {
    const token = socket.handshake.auth.token as string | undefined
    let userId: number | null = null
    let username = 'Anonyme'
    if (token) {
      try {
        const decoded = jwt.verify(token, secret) as JwtPayload
        userId = decoded.userId
        const [u] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId))
        if (u) username = u.username
      } catch {
        //
      }
    }
    socket.on('message', async (content: string) => {
      if (typeof content !== 'string' || !content.trim()) return
      if (!userId) {
        socket.emit('error', { message: 'Connecte-toi pour envoyer un message' })
        return
      }
      const [msg] = await db
        .insert(messages)
        .values({ senderId: userId, content: content.trim().slice(0, 2000) })
        .returning()
      io.emit('message', {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        username,
        senderId: userId,
      })
    })
  })
}
