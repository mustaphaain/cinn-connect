import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { friends, users } from '../db/schema.js'
import { and, eq, or, sql } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth.js'
import { AVATAR_PRESETS, isValidAvatarPreset } from '../lib/avatarPresets.js'

const router = Router()

router.get('/me', requireAuth, async (req, res: Response) => {
  const userId = (req as unknown as { userId: number }).userId
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' })
    return
  }
  res.json(user)
})

router.patch('/me', requireAuth, async (req, res: Response) => {
  const userId = (req as unknown as { userId: number }).userId
  const nextUsername = req.body?.username != null ? String(req.body.username).trim() : undefined
  const nextAvatar = req.body?.avatarUrl != null ? String(req.body.avatarUrl).trim() : undefined

  if (nextUsername === undefined && nextAvatar === undefined) {
    res.status(400).json({ error: 'Aucune modification fournie' })
    return
  }

  const patch: { username?: string; avatarUrl?: string | null } = {}

  if (nextUsername !== undefined) {
    if (nextUsername.length < 3 || nextUsername.length > 30) {
      res.status(400).json({ error: 'username invalide (3 à 30 caractères)' })
      return
    }
    const exists = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, nextUsername), sql`${users.id} <> ${userId}`))
      .limit(1)
    if (exists.length > 0) {
      res.status(409).json({ error: 'Pseudo déjà utilisé' })
      return
    }
    patch.username = nextUsername
  }

  if (nextAvatar !== undefined) {
    if (!isValidAvatarPreset(nextAvatar)) {
      res.status(400).json({ error: 'Avatar invalide' })
      return
    }
    patch.avatarUrl = nextAvatar
  }

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })

  res.json({ user: updated })
})

router.patch('/me/password', requireAuth, async (req, res: Response) => {
  const userId = (req as unknown as { userId: number }).userId
  const currentPassword = String(req.body?.currentPassword ?? '')
  const newPassword = String(req.body?.newPassword ?? '')

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword et newPassword requis' })
    return
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' })
    return
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' })
    return
  }
  if (!user.passwordHash) {
    res.status(400).json({ error: 'Compte Google: changement de mot de passe non disponible ici' })
    return
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Mot de passe actuel invalide' })
    return
  }

  const nextHash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ passwordHash: nextHash }).where(eq(users.id, userId))
  res.json({ ok: true })
})

router.get('/avatars/presets', async (_req, res: Response) => {
  res.json({ presets: AVATAR_PRESETS })
})

router.get('/search', requireAuth, async (req, res: Response) => {
  const userId = (req as unknown as { userId: number }).userId
  const q = String(req.query.username ?? '').trim()
  if (q.length < 2) {
    res.status(400).json({ error: 'username requis (min 2 caractères)' })
    return
  }
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(and(sql`lower(${users.username}) like ${`%${q.toLowerCase()}%`}`, sql`${users.id} <> ${userId}`))
    .limit(10)
  res.json(rows)
})

router.get('/:id', async (req, res: Response) => {
  const userId = Number(req.params.id)
  if (!Number.isFinite(userId) || userId <= 0) {
    res.status(400).json({ error: 'id invalide' })
    return
  }

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))

  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable' })
    return
  }

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(friends)
    .where(
      and(or(eq(friends.userId, userId), eq(friends.friendId, userId)), eq(friends.status, 'accepted'))
    )
  const friendsCount = Number(countRows[0]?.count ?? 0)

  res.json({ ...user, friendsCount })
})

export default router
