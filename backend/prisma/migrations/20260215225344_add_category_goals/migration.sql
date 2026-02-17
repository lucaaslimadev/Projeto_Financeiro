-- CreateTable
CREATE TABLE "category_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "monthly_limit" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_goals_user_id_idx" ON "category_goals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_goals_user_id_category_key" ON "category_goals"("user_id", "category");

-- AddForeignKey
ALTER TABLE "category_goals" ADD CONSTRAINT "category_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
