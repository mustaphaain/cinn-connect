CREATE TABLE IF NOT EXISTS "favorites" (
	"user_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_film_id_pk" PRIMARY KEY ("user_id","film_id");

