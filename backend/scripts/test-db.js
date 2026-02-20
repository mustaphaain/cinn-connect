import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const url = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/cineconnect'
const pool = new pg.Pool({ connectionString: url })

pool.query('SELECT 1').then(() => {
  console.log('Connexion OK')
  process.exit(0)
}).catch((err) => {
  console.error('Erreur:', err.message)
  process.exit(1)
}).finally(() => pool.end())
