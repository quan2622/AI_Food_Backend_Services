/*
  Warnings:

  - You are about to drop the column `userId` on the `meals` table. All the data in the column will be lost.
  - Added the required column `dailyLogId` to the `meals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "meals" DROP CONSTRAINT "meals_userId_fkey";

-- Clear old meal data (cascade clears meal_items and food_images)
TRUNCATE TABLE "meals" CASCADE;

-- AlterTable
ALTER TABLE "meals" DROP COLUMN "userId",
ADD COLUMN     "dailyLogId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
