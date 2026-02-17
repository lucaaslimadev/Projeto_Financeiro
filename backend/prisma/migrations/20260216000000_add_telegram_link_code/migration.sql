-- AlterTable
ALTER TABLE "users" ADD COLUMN "telegram_link_code" TEXT,
ADD COLUMN "telegram_link_code_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_telegram_link_code_idx" ON "users"("telegram_link_code");
