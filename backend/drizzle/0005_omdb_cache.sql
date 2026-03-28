CREATE TABLE IF NOT EXISTS "omdb_movie_cache" (
  "imdb_id" varchar(20) PRIMARY KEY NOT NULL,
  "title" varchar(512) NOT NULL,
  "year" varchar(32),
  "title_norm" varchar(512) NOT NULL,
  "rated" varchar(32),
  "released" varchar(64),
  "runtime" varchar(64),
  "genre" text,
  "director" text,
  "writer" text,
  "actors" text,
  "plot" text,
  "language" varchar(255),
  "country" varchar(255),
  "awards" text,
  "poster" varchar(1024),
  "ratings_json" text,
  "metascore" varchar(16),
  "imdb_rating" varchar(16),
  "imdb_votes" varchar(32),
  "type" varchar(32),
  "dvd" varchar(128),
  "box_office" varchar(128),
  "production" varchar(256),
  "website" varchar(512),
  "source" varchar(32) DEFAULT 'omdb' NOT NULL,
  "cached_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "omdb_movie_cache_title_norm_year_idx"
  ON "omdb_movie_cache" ("title_norm", "year");

CREATE TABLE IF NOT EXISTS "omdb_search_cache" (
  "id" serial PRIMARY KEY NOT NULL,
  "cache_key" varchar(256) NOT NULL,
  "payload_json" text NOT NULL,
  "source" varchar(32) DEFAULT 'omdb' NOT NULL,
  "cached_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "omdb_search_cache_key_unique"
  ON "omdb_search_cache" ("cache_key");
