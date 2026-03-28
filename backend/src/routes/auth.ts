import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  googleCallback,
  googleComplete,
  googleStart,
  login,
  logout,
  register,
} from '../controllers/authController.js'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/logout', asyncHandler(logout))
router.get('/google/start', asyncHandler(googleStart))
router.get('/google/callback', asyncHandler(googleCallback))
router.post('/google/complete', asyncHandler(googleComplete))

export default router
