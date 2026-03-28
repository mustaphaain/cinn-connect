import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../lib/httpError.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }
  const message = err instanceof Error ? err.message : 'Erreur interne'
  res.status(500).json({ error: message })
}

