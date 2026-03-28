function required(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v
}

function optional(name: string, fallback?: string): string | undefined {
  const v = process.env[name]?.trim()
  return v ? v : fallback
}

function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const nodeEnv = optional('NODE_ENV', 'development')
const isProd = nodeEnv === 'production'

export const env = {
  nodeEnv,
  isProd,

  port: Number(optional('PORT')) || 3001,
  databaseUrl: required('DATABASE_URL'),

  jwtSecret: required('JWT_SECRET'),
  authCookieName: optional('AUTH_COOKIE_NAME', 'cineconnect_auth')!,

  frontendOrigins: parseOrigins(optional('FRONTEND_ORIGIN', 'http://localhost:5173,http://localhost:5174')!),

  google: {
    clientId: optional('GOOGLE_CLIENT_ID', ''),
    clientSecret: optional('GOOGLE_CLIENT_SECRET', ''),
    redirectUri: optional('GOOGLE_REDIRECT_URI', 'http://localhost:3001/auth/google/callback')!,
    frontendAuthRedirect: optional('FRONTEND_AUTH_REDIRECT', 'http://localhost:5173/profil')!,
    frontendCompleteRedirect: optional('FRONTEND_GOOGLE_COMPLETE_REDIRECT', 'http://localhost:5173/complete-username')!,
  },

  /** Clé OMDb (https://www.omdbapi.com/) — requise uniquement pour combler un cache miss. */
  omdbApiKey: optional('OMDB_API_KEY', '')!,

  /**
   * Après N jours, une entrée cache est considérée périmée et sera re-fetchée au prochain accès.
   * 0 ou absent = cache persistant (pas d’expiration).
   */
  omdbCacheMaxAgeDays: Math.max(0, Number(optional('OMDB_CACHE_MAX_AGE_DAYS', '0')) || 0),
} as const

