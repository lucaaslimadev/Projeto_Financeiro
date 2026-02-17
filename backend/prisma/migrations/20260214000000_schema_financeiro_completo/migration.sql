-- Migration: Schema completo sistema financeiro (Users, Cards, Transactions)
-- Remove tabelas antigas e cria nova estrutura

-- Remove FKs e tabelas antigas (ordem por dependência)
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_installment_id_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_account_id_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_user_id_fkey";
DROP TABLE IF EXISTS "Transaction";

ALTER TABLE "Installment" DROP CONSTRAINT IF EXISTS "Installment_account_id_fkey";
ALTER TABLE "Installment" DROP CONSTRAINT IF EXISTS "Installment_user_id_fkey";
DROP TABLE IF EXISTS "Installment";

ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_user_id_fkey";
DROP TABLE IF EXISTS "Account";

ALTER TABLE "Alert" DROP CONSTRAINT IF EXISTS "Alert_user_id_fkey";
DROP TABLE IF EXISTS "Alert";

DROP TABLE IF EXISTS "User";

-- Remove enums antigos e cria novo
DROP TYPE IF EXISTS "AccountType";
DROP TYPE IF EXISTS "AlertChannel";
DROP TYPE IF EXISTS "TransactionType";

CREATE TYPE "TransactionType" AS ENUM ('FIXED', 'VARIABLE', 'CARD');

-- CreateTable: users (id como TEXT/UUID string compatível com Prisma)
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telegram_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: cards
CREATE TABLE "cards" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limit" DECIMAL(12,2) NOT NULL,
    "closing_day" INTEGER NOT NULL,
    "due_day" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transactions
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "card_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_day" INTEGER,
    "installment_total" INTEGER,
    "installment_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- Indexes: users
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");

-- Indexes: cards
CREATE INDEX "cards_user_id_idx" ON "cards"("user_id");

-- Indexes: transactions
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX "transactions_card_id_idx" ON "transactions"("card_id");
CREATE INDEX "transactions_due_date_idx" ON "transactions"("due_date");
CREATE INDEX "transactions_user_id_due_date_idx" ON "transactions"("user_id", "due_date");
CREATE INDEX "transactions_is_paid_idx" ON "transactions"("is_paid");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");
CREATE INDEX "transactions_user_id_type_idx" ON "transactions"("user_id", "type");

-- ForeignKeys
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
