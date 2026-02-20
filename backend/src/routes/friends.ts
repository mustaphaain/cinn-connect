import { Router, Request, Response } from 'express'
import { db } from '../db/index.js'
import { friends, users } from '../db/schema.js'
import { eq, or, and } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const rows = await db
    .select()
    .from(friends)
    .where(or(eq(friends.userId, userId), eq(friends.friendId, userId)))
  const accepted: { id: number; username: string; email: string }[] = []
  const pendingReceived: { id: number; username: string; userId: number }[] = []
  for (const row of rows) {
    const otherId = row.userId === userId ? row.friendId : row.userId
    const [other] = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.id, otherId))
    if (!other) continue
    if (row.status === 'accepted') {
      accepted.push({ id: other.id, username: other.username, email: other.email })
    } else if (row.friendId === userId) {
      pendingReceived.push({ id: other.id, username: other.username, userId: other.id })
    }
  }
  res.json({ friends: accepted, pendingReceived })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const friendId = Number(req.body.friendId)
  if (!friendId || friendId === userId) {
    res.status(400).json({ error: 'friendId invalide' })
    return
  }
  const [other] = await db.select().from(users).where(eq(users.id, friendId))
  if (!other) {
    res.status(404).json({ error: 'Utilisateur introuvable' })
    return
  }
  const existing1 = await db
    .select()
    .from(friends)
    .where(and(eq(friends.userId, userId), eq(friends.friendId, friendId)))
  const existing2 = await db
    .select()
    .from(friends)
    .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId)))
  if (existing1.length > 0 || existing2.length > 0) {
    res.status(409).json({ error: 'Demande déjà envoyée ou déjà amis' })
    return
  }
  await db.insert(friends).values({ userId, friendId, status: 'pending' })
  res.status(201).json({ message: 'Demande envoyée' })
})

router.patch('/:friendId/accept', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: number }).userId
  const friendId = Number(req.params.friendId)
  const updated = await db
    .update(friends)
    .set({ status: 'accepted' })
    .where(
      and(eq(friends.userId, friendId), eq(friends.friendId, userId), eq(friends.status, 'pending'))
    )
    .returning()
  if (updated.length === 0) {
    res.status(404).json({ error: 'Demande non trouvée' })
    return
  }
  res.json(updated[0])
})

export default router
