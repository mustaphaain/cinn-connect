import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { getFilmsByGenre } from '../controllers/filmsController.js'
import {
  getOmdbMovie,
  getOmdbMovieByTitleYear,
  searchOmdbMovies,
} from '../controllers/omdbController.js'

const router = Router()

router.get('/omdb/search', asyncHandler(searchOmdbMovies))
router.get('/omdb/by-title', asyncHandler(getOmdbMovieByTitleYear))
router.get('/omdb/movie/:imdbId', asyncHandler(getOmdbMovie))
router.get('/by-genre', asyncHandler(getFilmsByGenre))

export default router

