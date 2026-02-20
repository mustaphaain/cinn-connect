import { Router, Response } from 'express'
import { db } from '../db/index.js'
import { messages, users } from '../db/schema.js'
import { desc, eq } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req, res: Response) => {
  const list = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      username: users.username,
      senderId: messages.senderId,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .orderBy(desc(messages.createdAt))
    .limit(50)
  res.json(list.reverse())
})

export default router
