import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listFriends,
  refuseFriendRequest,
  sendFriendRequest,
} from '../controllers/friendsController.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(listFriends))
router.post('/', requireAuth, asyncHandler(sendFriendRequest))
router.patch('/:friendId/accept', requireAuth, asyncHandler(acceptFriendRequest))
router.delete('/:friendId/refuse', requireAuth, asyncHandler(refuseFriendRequest))
router.delete('/:friendId/cancel', requireAuth, asyncHandler(cancelFriendRequest))

export default router
