/*
  Warnings:

  - The values [SEDENTARY,LIGHTLY_ACTIVE,MODERATELY_ACTIVE,VERY_ACTIVE,SUPER_ACTIVE] on the enum `ActivityLevel` will be removed. If these variants are still used in the database, this will fail.
  - The values [WEIGHT_LOSS,WEIGHT_GAIN,MAINTENANCE,STRICT_DIET] on the enum `GoalType` will be removed. If these variants are still used in the database, this will fail.
  - The values [BREAKFAST,LUNCH,DINNER,SNACK] on the enum `MealType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ONGOING,COMPLETED,PAUSED,FAILED] on the enum `NutritionGoalStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [UPLOAD_COUNT,POPULAR_FOOD,TRAFFIC] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LOW,MEDIUM,HIGH,LIFE_THREATENING] on the enum `SeverityType` will be removed. If these variants are still used in the database, this will fail.
  - The values [USDA,MANUAL,CALCULATED] on the enum `SourceType` will be removed. If these variants are still used in the database, this will fail.
  - The values [BELOW,MET,ABOVE] on the enum `StatusType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ActivityLevel_new" AS ENUM ('ACT_SEDENTARY', 'ACT_LIGHT', 'ACT_MODERATE', 'ACT_VERY', 'ACT_SUPER');
ALTER TYPE "ActivityLevel" RENAME TO "ActivityLevel_old";
ALTER TYPE "ActivityLevel_new" RENAME TO "ActivityLevel";
DROP TYPE "public"."ActivityLevel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GoalType_new" AS ENUM ('GOAL_LOSS', 'GOAL_GAIN', 'GOAL_MAINTAIN', 'GOAL_STRICT');
ALTER TYPE "GoalType" RENAME TO "GoalType_old";
ALTER TYPE "GoalType_new" RENAME TO "GoalType";
DROP TYPE "public"."GoalType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MealType_new" AS ENUM ('MEAL_BREAKFAST', 'MEAL_LUNCH', 'MEAL_DINNER', 'MEAL_SNACK');
ALTER TYPE "MealType" RENAME TO "MealType_old";
ALTER TYPE "MealType_new" RENAME TO "MealType";
DROP TYPE "public"."MealType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NutritionGoalStatus_new" AS ENUM ('NUTR_GOAL_ONGOING', 'NUTR_GOAL_COMPLETED', 'NUTR_GOAL_PAUSED', 'NUTR_GOAL_FAILED');
ALTER TABLE "public"."nutrition_goals" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "nutrition_goals" ALTER COLUMN "status" TYPE "NutritionGoalStatus_new" USING ("status"::text::"NutritionGoalStatus_new");
ALTER TYPE "NutritionGoalStatus" RENAME TO "NutritionGoalStatus_old";
ALTER TYPE "NutritionGoalStatus_new" RENAME TO "NutritionGoalStatus";
DROP TYPE "public"."NutritionGoalStatus_old";
ALTER TABLE "nutrition_goals" ALTER COLUMN "status" SET DEFAULT 'NUTR_GOAL_ONGOING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReportType_new" AS ENUM ('REP_UPLOAD', 'REP_POPULAR', 'REP_TRAFFIC');
ALTER TYPE "ReportType" RENAME TO "ReportType_old";
ALTER TYPE "ReportType_new" RENAME TO "ReportType";
DROP TYPE "public"."ReportType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SeverityType_new" AS ENUM ('SEV_LOW', 'SEV_MEDIUM', 'SEV_HIGH', 'SEV_LIFE_THREATENING');
ALTER TYPE "SeverityType" RENAME TO "SeverityType_old";
ALTER TYPE "SeverityType_new" RENAME TO "SeverityType";
DROP TYPE "public"."SeverityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SourceType_new" AS ENUM ('SRC_USDA', 'SRC_MANUAL', 'SRC_CALC');
ALTER TYPE "SourceType" RENAME TO "SourceType_old";
ALTER TYPE "SourceType_new" RENAME TO "SourceType";
DROP TYPE "public"."SourceType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StatusType_new" AS ENUM ('STATUS_BELOW', 'STATUS_MET', 'STATUS_ABOVE');
ALTER TYPE "StatusType" RENAME TO "StatusType_old";
ALTER TYPE "StatusType_new" RENAME TO "StatusType";
DROP TYPE "public"."StatusType_old";
COMMIT;

-- AlterTable
ALTER TABLE "nutrition_goals" ALTER COLUMN "status" SET DEFAULT 'NUTR_GOAL_ONGOING';
