import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { deleteMessage, listPrivateMessages, listPublicMessages } from '../controllers/messagesController.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(listPublicMessages))
router.get('/private/:friendId', requireAuth, asyncHandler(listPrivateMessages))
router.delete('/:id', requireAuth, asyncHandler(deleteMessage))

export default router
