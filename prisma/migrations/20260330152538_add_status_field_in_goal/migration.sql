-- CreateEnum
CREATE TYPE "NutritionGoalStatus" AS ENUM ('ONGOING', 'COMPLETED', 'PAUSED', 'FAILED');

-- AlterTable
ALTER TABLE "nutrition_goals" ADD COLUMN     "status" "NutritionGoalStatus" NOT NULL DEFAULT 'ONGOING';
