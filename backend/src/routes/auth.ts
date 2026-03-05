import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'

const router = Router()

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-en-prod'

function signToken(userId: number) {
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

router.post('/register', async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const username = String(req.body?.username ?? '').trim()

  if (!email || !password || !username) {
    res.status(400).json({ error: 'email, password et username requis' })
    return
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length > 0) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, username })
    .returning({ id: users.id, email: users.email, username: users.username })

  const token = signToken(created.id)
  res.status(201).json({ user: created, token })
})

router.post('/login', async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!email || !password) {
    res.status(400).json({ error: 'email et password requis' })
    return
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))

  if (!user) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  const token = signToken(user.id)
  res.json({ user: { id: user.id, email: user.email, username: user.username }, token })
})

export default router
