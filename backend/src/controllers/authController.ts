import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { isValidAvatarPreset, randomAvatarPreset } from '../lib/avatarPresets.js'
import { env } from '../config/env.js'

const secret = env.jwtSecret
const cookieName = env.authCookieName
const isProd = env.isProd
const maxAgeMs = 7 * 24 * 60 * 60 * 1000

const googleClientId = env.google.clientId ?? ''
const googleClientSecret = env.google.clientSecret ?? ''
const googleRedirectUri = env.google.redirectUri
const frontendAuthRedirect = env.google.frontendAuthRedirect
const frontendGoogleCompleteRedirect = env.google.frontendCompleteRedirect

const oauth2Client = new OAuth2Client({
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  redirectUri: googleRedirectUri,
})

const googleStateCookie = 'google_oauth_state'
const googlePendingCookie = 'google_pending'
const googlePendingMaxAgeMs = 10 * 60 * 1000

function signToken(userId: number) {
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

type GooglePendingPayload = {
  sub: string
  email: string
  name?: string
  picture?: string
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: maxAgeMs,
  })
}

function clearAuthCookie(res: Response) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  })
}

function setShortCookie(res: Response, name: string, value: string, maxAge: number) {
  res.cookie(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge,
  })
}

function clearShortCookie(res: Response, name: string) {
  res.clearCookie(name, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  })
}

export async function register(req: Request, res: Response) {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const username = String(req.body?.username ?? '').trim()
  const avatarFromBody = req.body?.avatarUrl != null ? String(req.body.avatarUrl).trim() : null

  if (!email || !password || !username) {
    res.status(400).json({ error: 'email, password et username requis' })
    return
  }
  if (avatarFromBody != null && !isValidAvatarPreset(avatarFromBody)) {
    res.status(400).json({ error: 'Avatar invalide' })
    return
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length > 0) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const avatarUrl = avatarFromBody ?? randomAvatarPreset()
  const [created] = await db
    .insert(users)
    .values({ email, passwordHash, username, avatarUrl })
    .returning({ id: users.id, email: users.email, username: users.username, avatarUrl: users.avatarUrl })

  const token = signToken(created.id)
  setAuthCookie(res, token)
  res.status(201).json({ user: created })
}

export async function login(req: Request, res: Response) {
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
      avatarUrl: users.avatarUrl,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))

  if (!user) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: 'Ce compte utilise Google. Connecte-toi avec Google.' })
    return
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }

  const token = signToken(user.id)
  setAuthCookie(res, token)
  res.json({ user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl } })
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res)
  clearShortCookie(res, googlePendingCookie)
  clearShortCookie(res, googleStateCookie)
  res.json({ ok: true })
}

export async function googleStart(_req: Request, res: Response) {
  if (!googleClientId || !googleClientSecret) {
    res.status(500).json({ error: 'Google OAuth non configuré (GOOGLE_CLIENT_ID/SECRET)' })
    return
  }
  const state = crypto.randomBytes(24).toString('hex')
  setShortCookie(res, googleStateCookie, state, 10 * 60 * 1000)
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
    state,
  })
  res.redirect(url)
}

export async function googleCallback(req: Request, res: Response) {
  const code = String(req.query?.code ?? '')
  const state = String(req.query?.state ?? '')
  const cookieState = req.cookies?.[googleStateCookie]

  if (!code) {
    res.status(400).json({ error: 'Code OAuth manquant' })
    return
  }
  if (!state || !cookieState || state !== cookieState) {
    res.status(400).json({ error: 'State OAuth invalide' })
    return
  }
  clearShortCookie(res, googleStateCookie)

  try {
    const { tokens } = await oauth2Client.getToken(code)
    const idToken = tokens.id_token
    if (!idToken) {
      res.status(400).json({ error: 'id_token manquant' })
      return
    }
    const ticket = await oauth2Client.verifyIdToken({ idToken, audience: googleClientId })
    const payload = ticket.getPayload()
    const sub = payload?.sub
    const email = payload?.email?.toLowerCase()
    const name = payload?.name
    const picture = payload?.picture

    if (!sub || !email) {
      res.status(400).json({ error: 'Profil Google incomplet (email/sub)' })
      return
    }

    const [linked] = await db
      .select({ id: users.id, email: users.email, username: users.username, googleId: users.googleId })
      .from(users)
      .where(eq(users.googleId, sub))

    if (linked) {
      const token = signToken(linked.id)
      setAuthCookie(res, token)
      res.redirect(frontendAuthRedirect)
      return
    }

    const [byEmail] = await db
      .select({ id: users.id, googleId: users.googleId })
      .from(users)
      .where(eq(users.email, email))

    if (byEmail && !byEmail.googleId) {
      const [updated] = await db
        .update(users)
        .set({ googleId: sub, avatarUrl: picture ?? null })
        .where(eq(users.id, byEmail.id))
        .returning({ id: users.id })
      const token = signToken(updated.id)
      setAuthCookie(res, token)
      res.redirect(frontendAuthRedirect)
      return
    }

    if (byEmail && byEmail.googleId) {
      res.status(409).json({ error: 'Email déjà associé à un compte' })
      return
    }

    const pendingJwt = jwt.sign({ sub, email, name, picture } satisfies GooglePendingPayload, secret, {
      expiresIn: '10m',
    })
    setShortCookie(res, googlePendingCookie, pendingJwt, googlePendingMaxAgeMs)
    res.redirect(frontendGoogleCompleteRedirect)
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'OAuth Google échoué' })
  }
}

export async function googleComplete(req: Request, res: Response) {
  const pending = req.cookies?.[googlePendingCookie]
  const username = String(req.body?.username ?? '').trim()
  if (!pending) {
    res.status(401).json({ error: 'Session Google expirée. Recommence la connexion.' })
    return
  }
  if (!username) {
    res.status(400).json({ error: 'username requis' })
    return
  }
  if (username.length < 3 || username.length > 30) {
    res.status(400).json({ error: 'username invalide (3 à 30 caractères)' })
    return
  }

  let decoded: GooglePendingPayload
  try {
    decoded = jwt.verify(pending, secret) as GooglePendingPayload
  } catch {
    clearShortCookie(res, googlePendingCookie)
    res.status(401).json({ error: 'Session Google expirée. Recommence la connexion.' })
    return
  }

  const email = decoded.email.toLowerCase()
  const sub = decoded.sub
  const picture = decoded.picture

  const existingUsername = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
  if (existingUsername.length > 0) {
    res.status(409).json({ error: 'Pseudo déjà utilisé' })
    return
  }

  const existingEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existingEmail.length > 0) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      username,
      passwordHash: null,
      googleId: sub,
      avatarUrl: picture ?? null,
    })
    .returning({ id: users.id, email: users.email, username: users.username, avatarUrl: users.avatarUrl })

  clearShortCookie(res, googlePendingCookie)
  const token = signToken(created.id)
  setAuthCookie(res, token)
  res.status(201).json({ user: created })
}

