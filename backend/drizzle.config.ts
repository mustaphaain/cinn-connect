import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const backendRoot = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(backendRoot, '.env') })

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/cineconnect'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: connectionString },
})
