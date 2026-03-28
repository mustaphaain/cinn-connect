import { Router, Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  getAvatarPresets,
  getMe,
  getUserPublic,
  patchMe,
  patchMyPassword,
  searchUsers,
} from '../controllers/usersController.js'

const router = Router()

router.get('/me', requireAuth, asyncHandler(getMe))
router.patch('/me', requireAuth, asyncHandler(patchMe))
router.patch('/me/password', requireAuth, asyncHandler(patchMyPassword))
router.get('/avatars/presets', asyncHandler(getAvatarPresets))
router.get('/search', requireAuth, asyncHandler(searchUsers))
router.get('/:id', asyncHandler(getUserPublic))

export default router
