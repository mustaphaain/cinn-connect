import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type JwtPayload = { userId: number }

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-en-prod'
const cookieName = process.env.AUTH_COOKIE_NAME ?? 'cineconnect_auth'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req as Request & { cookies?: Record<string, string | undefined> }).cookies?.[cookieName]
  if (!token) {
    res.status(401).json({ error: 'Token manquant' })
    return
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload
    ;(req as Request & { userId: number }).userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
