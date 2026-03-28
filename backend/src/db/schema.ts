import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  username: varchar('username', { length: 100 }).notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const films = pgTable('films', {
  id: serial('id').primaryKey(),
  imdbId: varchar('imdb_id', { length: 20 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  poster: varchar('poster', { length: 500 }),
  year: varchar('year', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Genres OMDb normalisés (un film peut avoir plusieurs genres).
// Ex: "Animation, Action, Adventure" => 3 lignes dans `film_genres`.
export const filmGenres = pgTable(
  'film_genres',
  {
    filmId: integer('film_id')
      .notNull()
      .references(() => films.id, { onDelete: 'cascade' }),
    genre: varchar('genre', { length: 100 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.filmId, t.genre] })]
)

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filmId: integer('film_id')
    .notNull()
    .references(() => films.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const favorites = pgTable(
  'favorites',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    filmId: integer('film_id')
      .notNull()
      .references(() => films.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.filmId] })]
)

export const friends = pgTable(
  'friends',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    friendId: integer('friend_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.friendId] })]
)

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/** Réponses détail OMDb mises en cache (clé unique : imdb_id). */
export const omdbMovieCache = pgTable(
  'omdb_movie_cache',
  {
    imdbId: varchar('imdb_id', { length: 20 }).primaryKey(),
    title: varchar('title', { length: 512 }).notNull(),
    year: varchar('year', { length: 32 }),
    titleNorm: varchar('title_norm', { length: 512 }).notNull(),
    rated: varchar('rated', { length: 32 }),
    released: varchar('released', { length: 64 }),
    runtime: varchar('runtime', { length: 64 }),
    genre: text('genre'),
    director: text('director'),
    writer: text('writer'),
    actors: text('actors'),
    plot: text('plot'),
    language: varchar('language', { length: 255 }),
    country: varchar('country', { length: 255 }),
    awards: text('awards'),
    poster: varchar('poster', { length: 1024 }),
    ratingsJson: text('ratings_json'),
    metascore: varchar('metascore', { length: 16 }),
    imdbRating: varchar('imdb_rating', { length: 16 }),
    imdbVotes: varchar('imdb_votes', { length: 32 }),
    type: varchar('type', { length: 32 }),
    dvd: varchar('dvd', { length: 128 }),
    boxOffice: varchar('box_office', { length: 128 }),
    production: varchar('production', { length: 256 }),
    website: varchar('website', { length: 512 }),
    source: varchar('source', { length: 32 }).notNull().default('omdb'),
    cachedAt: timestamp('cached_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('omdb_movie_cache_title_norm_year_idx').on(t.titleNorm, t.year)]
)

/** Réponses de recherche OMDb (clé déterministe query + page + type). */
export const omdbSearchCache = pgTable(
  'omdb_search_cache',
  {
    id: serial('id').primaryKey(),
    cacheKey: varchar('cache_key', { length: 256 }).notNull(),
    payloadJson: text('payload_json').notNull(),
    source: varchar('source', { length: 32 }).notNull().default('omdb'),
    cachedAt: timestamp('cached_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('omdb_search_cache_key_unique').on(t.cacheKey)]
)
