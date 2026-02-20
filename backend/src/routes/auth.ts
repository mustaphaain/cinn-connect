import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import type { JwtPayload } from '../middleware/auth.js'

const router = Router()
const secret = process.env.JWT_SECRET ?? 'dev-secret-change-en-prod'

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, username } = req.body
  if (!email || !password || !username) {
    res.status(400).json({ error: 'email, password et username requis' })
    return
  }
  const hash = bcrypt.hashSync(password, 10)
  try {
    const [user] = await db
      .insert(users)
      .values({
        email: String(email).trim().toLowerCase(),
        passwordHash: hash,
        username: String(username).trim(),
      })
      .returning({ id: users.id, email: users.email, username: users.username, createdAt: users.createdAt })
    const token = jwt.sign({ userId: user.id } as JwtPayload, secret, { expiresIn: '7d' })
    res.status(201).json({ user: { id: user.id, email: user.email, username: user.username }, token })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
      res.status(409).json({ error: 'Cet email est déjà utilisé' })
      return
    }
    throw err
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email et password requis' })
    return
  }
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, String(email).trim().toLowerCase()))
  if (!user) {
    res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    return
  }
  if (!bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    return
  }
  const token = jwt.sign({ userId: user.id } as JwtPayload, secret, { expiresIn: '7d' })
  res.json({ user: { id: user.id, email: user.email, username: user.username }, token })
})

export default router
