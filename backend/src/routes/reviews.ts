import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  getMyRatingByFilm,
  getMyReviews,
  getReviewsByFilm,
  getReviewsByUser,
  getReviewsSummaryByFilm,
  postReview,
} from '../controllers/reviewsController.js'

const router = Router()

router.get('/me', requireAuth, asyncHandler(getMyReviews))
router.get('/film/:imdbId', asyncHandler(getReviewsByFilm))
router.get('/film/:imdbId/summary', asyncHandler(getReviewsSummaryByFilm))
router.get('/me/film/:imdbId', requireAuth, asyncHandler(getMyRatingByFilm))
router.get('/user/:userId', asyncHandler(getReviewsByUser))
router.post('/', requireAuth, asyncHandler(postReview))

export default router
