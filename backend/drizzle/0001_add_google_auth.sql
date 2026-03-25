ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500);

ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

