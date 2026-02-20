import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config()

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/cineconnect'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: connectionString },
})
