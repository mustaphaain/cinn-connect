import './env.js'
import http from 'http'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import reviewRoutes from './routes/reviews.js'
import friendRoutes from './routes/friends.js'
import messageRoutes from './routes/messages.js'
import favoriteRoutes from './routes/favorites.js'
import filmsRoutes from './routes/films.js'
import { setupSocket } from './socket.js'
import swaggerUi from 'swagger-ui-express'
import { openApiSpec } from './swagger.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const port = env.port
const server = http.createServer(app)
const frontendOrigins = env.frontendOrigins

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return true
  return frontendOrigins.includes(origin)
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin))
    },
    credentials: true,
  },
})
setupSocket(io)

app.use(
  helmet({
    // Swagger UI uses inline styles/scripts; keep CSP disabled in dev for simplicity.
    contentSecurityPolicy: false,
  })
)
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin))
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/reviews', reviewRoutes)
app.use('/friends', friendRoutes)
app.use('/messages', messageRoutes)
app.use('/favorites', favoriteRoutes)
app.use('/films', filmsRoutes)
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'cin-connect-api',
    time: new Date().toISOString(),
  })
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))
app.use(errorHandler)

server.listen(port, () => {
  console.log(`Serveur sur http://localhost:${port}`)
})