-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DEBIT', 'PIX', 'CASH', 'CREDIT');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "payment_method" "PaymentMethod";
