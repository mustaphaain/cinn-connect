import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import reviewRoutes from './routes/reviews.js'
import friendRoutes from './routes/friends.js'
import messageRoutes from './routes/messages.js'
import { setupSocket } from './socket.js'
import swaggerUi from 'swagger-ui-express'
import { openApiSpec } from './swagger.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })
setupSocket(io)

app.use(cors())
app.use(express.json())
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/reviews', reviewRoutes)
app.use('/friends', friendRoutes)
app.use('/messages', messageRoutes)
app.get('/health', (_req, res) => res.json({ ok: true, message: 'CinéConnect API' }))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))

server.listen(port, () => console.log(`Serveur sur http://localhost:${port}`))
