import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { and, eq, or, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { friends, users } from '../db/schema.js'
import { AVATAR_PRESETS, isValidAvatarPreset } from '../lib/avatarPresets.js'

export async function getMe(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })

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

  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
  res.json(user)
}

export async function patchMe(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })

  const nextUsername = req.body?.username != null ? String(req.body.username).trim() : undefined
  const nextAvatar = req.body?.avatarUrl != null ? String(req.body.avatarUrl).trim() : undefined
  if (nextUsername === undefined && nextAvatar === undefined) {
    return res.status(400).json({ error: 'Aucune modification fournie' })
  }

  const patch: { username?: string; avatarUrl?: string | null } = {}

  if (nextUsername !== undefined) {
    if (nextUsername.length < 3 || nextUsername.length > 30) {
      return res.status(400).json({ error: 'username invalide (3 à 30 caractères)' })
    }
    const exists = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, nextUsername), sql`${users.id} <> ${userId}`))
      .limit(1)
    if (exists.length > 0) return res.status(409).json({ error: 'Pseudo déjà utilisé' })
    patch.username = nextUsername
  }

  if (nextAvatar !== undefined) {
    if (!isValidAvatarPreset(nextAvatar)) return res.status(400).json({ error: 'Avatar invalide' })
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
}

export async function patchMyPassword(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })

  const currentPassword = String(req.body?.currentPassword ?? '')
  const newPassword = String(req.body?.newPassword ?? '')
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword et newPassword requis' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' })
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
  if (!user.passwordHash) {
    return res.status(400).json({ error: 'Compte Google: changement de mot de passe non disponible ici' })
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Mot de passe actuel invalide' })

  const nextHash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ passwordHash: nextHash }).where(eq(users.id, userId))
  res.json({ ok: true })
}

export async function getAvatarPresets(_req: Request, res: Response) {
  res.json({ presets: AVATAR_PRESETS })
}

export async function searchUsers(req: Request, res: Response) {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Non authentifié' })
  const q = String(req.query.username ?? '').trim()
  if (q.length < 2) return res.status(400).json({ error: 'username requis (min 2 caractères)' })

  const rows = await db
    .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(and(sql`lower(${users.username}) like ${`%${q.toLowerCase()}%`}`, sql`${users.id} <> ${userId}`))
    .limit(10)

  res.json(rows)
}

export async function getUserPublic(req: Request, res: Response) {
  const userId = Number(req.params.id)
  if (!Number.isFinite(userId) || userId <= 0) return res.status(400).json({ error: 'id invalide' })

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(friends)
    .where(and(or(eq(friends.userId, userId), eq(friends.friendId, userId)), eq(friends.status, 'accepted')))
  const friendsCount = Number(countRows[0]?.count ?? 0)

  res.json({ ...user, friendsCount })
}

