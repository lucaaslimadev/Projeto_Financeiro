-- Alinha o schema ao estado atual do banco (drop defaults já aplicado pela migration removida)
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT, ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "cards" ALTER COLUMN "id" DROP DEFAULT, ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "transactions" ALTER COLUMN "id" DROP DEFAULT, ALTER COLUMN "updated_at" DROP DEFAULT;
