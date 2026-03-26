import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import reviewRoutes from './routes/reviews.js'
import friendRoutes from './routes/friends.js'
import messageRoutes from './routes/messages.js'
import favoriteRoutes from './routes/favorites.js'
import { setupSocket } from './socket.js'
import swaggerUi from 'swagger-ui-express'
import { openApiSpec } from './swagger.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const server = http.createServer(app)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const io = new Server(server, { cors: { origin: frontendOrigin, credentials: true } })
setupSocket(io)

app.use(
  cors({
    origin: frontendOrigin,
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
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'cin-connect-api',
    time: new Date().toISOString(),
  })
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))

server.listen(port, "0.0.0.0", () => 
  console.log(`Serveur sur http://127.0.0.1:${port}`)
)