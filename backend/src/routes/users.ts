import { Router, Response } from 'express'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/me', requireAuth, async (req, res: Response) => {
  const userId = (req as unknown as { userId: number }).userId
  const [user] = await db
    .select({ id: users.id, email: users.email, username: users.username, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' })
    return
  }
  res.json(user)
})

export default router
