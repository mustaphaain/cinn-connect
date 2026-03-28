import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.js'
import { env } from '../config/env.js'

const connectionString = env.databaseUrl

const pool = new pg.Pool({ connectionString })
export const db = drizzle(pool, { schema })
