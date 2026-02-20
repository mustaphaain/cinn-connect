import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type JwtPayload = { userId: number }

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-en-prod'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' })
    return
  }
  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload
    ;(req as Request & { userId: number }).userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
