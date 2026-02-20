import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const url = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/cineconnect'
const urlAdmin = url.replace(/\/cineconnect\s*$/, '/postgres')
const pool = new pg.Pool({ connectionString: urlAdmin })

const client = await pool.connect()
try {
  const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'cineconnect'")
  if (res.rows.length === 0) {
    await client.query('CREATE DATABASE cineconnect')
    console.log('Base cineconnect créée.')
  } else {
    console.log('Base cineconnect existe déjà.')
  }
} finally {
  client.release()
  await pool.end()
}
