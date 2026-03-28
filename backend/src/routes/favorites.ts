import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  addFavorite,
  isFavorite,
  listFavorites,
  removeFavorite,
} from '../controllers/favoritesController.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(listFavorites))
router.get('/:imdbId', requireAuth, asyncHandler(isFavorite))
router.post('/', requireAuth, asyncHandler(addFavorite))
router.delete('/:imdbId', requireAuth, asyncHandler(removeFavorite))

export default router

