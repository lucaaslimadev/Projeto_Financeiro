-- Add password_hash to users (auth)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- Existing rows: set a placeholder; new signups will have real hash
UPDATE "users" SET "password_hash" = '$2a$10$placeholder.hash.update.via.seed' WHERE "password_hash" IS NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;
