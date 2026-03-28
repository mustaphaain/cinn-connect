import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export type JwtPayload = { userId: number }

const secret = env.jwtSecret
const cookieName = env.authCookieName

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[cookieName]
  if (!token) {
    res.status(401).json({ error: 'Token manquant' })
    return
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
