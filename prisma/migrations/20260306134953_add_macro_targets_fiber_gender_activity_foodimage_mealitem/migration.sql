/*
  Warnings:

  - You are about to drop the column `mealId` on the `food_images` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `foods` table. All the data in the column will be lost.
  - Added the required column `mealItemId` to the `food_images` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "food_images" DROP CONSTRAINT "food_images_mealId_fkey";

-- AlterTable
ALTER TABLE "daily_logs" ADD COLUMN     "targetFat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "targetFiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalFiber" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "food_images" DROP COLUMN "mealId",
ADD COLUMN     "mealItemId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "foods" DROP COLUMN "category",
ADD COLUMN     "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "meal_items" ADD COLUMN     "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "nutrition_goals" ADD COLUMN     "targetCarbsPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "targetFatPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "targetProteinPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "gender" TEXT;

-- AddForeignKey
ALTER TABLE "food_images" ADD CONSTRAINT "food_images_mealItemId_fkey" FOREIGN KEY ("mealItemId") REFERENCES "meal_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
