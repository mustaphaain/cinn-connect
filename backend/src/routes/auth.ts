import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { isValidAvatarPreset, randomAvatarPreset } from '../lib/avatarPresets.js'

const router = Router()

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-en-prod'
const cookieName = process.env.AUTH_COOKIE_NAME ?? 'cineconnect_auth'
const isProd = process.env.NODE_ENV === 'production'
const maxAgeMs = 7 * 24 * 60 * 60 * 1000

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? ''
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3001/auth/google/callback'
const frontendAuthRedirect = process.env.FRONTEND_AUTH_REDIRECT ?? 'http://localhost:5173/profil'
const frontendGoogleCompleteRedirect =
  process.env.FRONTEND_GOOGLE_COMPLETE_REDIRECT ?? 'http://localhost:5173/complete-username'

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

router.post('/register', async (req: Request, res: Response) => {
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
})

router.post('/logout', async (_req: Request, res: Response) => {
  clearAuthCookie(res)
  clearShortCookie(res, googlePendingCookie)
  clearShortCookie(res, googleStateCookie)
  res.json({ ok: true })
})

router.get('/google/start', async (_req: Request, res: Response) => {
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
})

router.get('/google/callback', async (req: Request, res: Response) => {
  const code = String(req.query?.code ?? '')
  const state = String(req.query?.state ?? '')
  const cookieState = (req as Request & { cookies?: Record<string, string | undefined> }).cookies?.[googleStateCookie]

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
      // Email déjà lié à un autre googleId ou compte déjà lié
      res.status(409).json({ error: 'Email déjà associé à un compte' })
      return
    }

    // Nouveau compte Google: on force le choix de username côté frontend
    const pendingJwt = jwt.sign({ sub, email, name, picture } satisfies GooglePendingPayload, secret, {
      expiresIn: '10m',
    })
    setShortCookie(res, googlePendingCookie, pendingJwt, googlePendingMaxAgeMs)
    res.redirect(frontendGoogleCompleteRedirect)
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : 'OAuth Google échoué' })
  }
})

router.post('/google/complete', async (req: Request, res: Response) => {
  const pending = (req as Request & { cookies?: Record<string, string | undefined> }).cookies?.[googlePendingCookie]
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
})

export default router
