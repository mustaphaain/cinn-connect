CREATE TABLE IF NOT EXISTS "film_genres" (
  "film_id" integer NOT NULL,
  "genre" varchar(100) NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "film_genres" ADD CONSTRAINT "film_genres_film_id_films_id_fk"
  FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "film_genres" ADD CONSTRAINT "film_genres_film_id_genre_pk" PRIMARY KEY ("film_id","genre");

CREATE INDEX IF NOT EXISTS "film_genres_genre_idx" ON "film_genres"("genre");

