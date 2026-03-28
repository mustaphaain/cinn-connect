import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { listPrivateMessages, listPublicMessages } from '../controllers/messagesController.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(listPublicMessages))
router.get('/private/:friendId', requireAuth, asyncHandler(listPrivateMessages))

export default router
