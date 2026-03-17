/*
  Warnings:

  - You are about to drop the column `targetCalories` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `targetCarbs` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `targetFat` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `targetFiber` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `targetProtein` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `totalCalories` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `totalCarbs` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `totalFat` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `totalFiber` on the `daily_logs` table. All the data in the column will be lost.
  - You are about to drop the column `totalProtein` on the `daily_logs` table. All the data in the column will be lost.
  - The `status` column on the `daily_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `food_categories` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `food_categories` table. All the data in the column will be lost.
  - You are about to drop the column `mealItemId` on the `food_images` table. All the data in the column will be lost.
  - You are about to drop the column `componentId` on the `food_nutrition_values` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `food_nutrition_values` table. All the data in the column will be lost.
  - You are about to drop the column `nutritionId` on the `food_nutrition_values` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `food_nutrition_values` table. All the data in the column will be lost.
  - You are about to drop the column `calories` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `carbs` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `fat` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `fiber` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `foodType` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `protein` on the `foods` table. All the data in the column will be lost.
  - You are about to drop the column `totalCalories` on the `meals` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `nutrition_goals` table. All the data in the column will be lost.
  - You are about to drop the column `targetCaloriesPerDay` on the `nutrition_goals` table. All the data in the column will be lost.
  - You are about to drop the column `targetCarbsPerDay` on the `nutrition_goals` table. All the data in the column will be lost.
  - You are about to drop the column `targetFatPerDay` on the `nutrition_goals` table. All the data in the column will be lost.
  - You are about to drop the column `targetProteinPerDay` on the `nutrition_goals` table. All the data in the column will be lost.
  - You are about to drop the column `allergies` on the `user_profiles` table. All the data in the column will be lost.
  - The `activityLevel` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `birthOfDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `genderCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `dish_ingredients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `food_nutritions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nutrition_components` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[foodNutritionProfileId,nutrientId]` on the table `food_nutrition_values` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mealId` to the `food_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `food_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foodNutritionProfileId` to the `food_nutrition_values` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nutrientId` to the `food_nutrition_values` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `mealType` on the `meals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `startDay` to the `nutrition_goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetCalories` to the `nutrition_goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetCarbs` to the `nutrition_goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetFat` to the `nutrition_goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetProtein` to the `nutrition_goals` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `goalType` on the `nutrition_goals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT_LOSS', 'WEIGHT_GAIN', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('BELOW', 'MET', 'ABOVE');

-- CreateEnum
CREATE TYPE "SeverityType" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'LIFE_THREATENING');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'SUPER_ACTIVE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('UPLOAD_COUNT', 'POPULAR_FOOD', 'TRAFFIC');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('USDA', 'MANUAL', 'CALCULATED');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('UNIT_G', 'UNIT_KG', 'UNIT_MG', 'UNIT_OZ', 'UNIT_LB');

-- DropForeignKey
ALTER TABLE "dish_ingredients" DROP CONSTRAINT "dish_ingredients_dishId_fkey";

-- DropForeignKey
ALTER TABLE "dish_ingredients" DROP CONSTRAINT "dish_ingredients_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "food_images" DROP CONSTRAINT "food_images_mealItemId_fkey";

-- DropForeignKey
ALTER TABLE "food_nutrition_values" DROP CONSTRAINT "food_nutrition_values_componentId_fkey";

-- DropForeignKey
ALTER TABLE "food_nutrition_values" DROP CONSTRAINT "food_nutrition_values_nutritionId_fkey";

-- DropForeignKey
ALTER TABLE "food_nutritions" DROP CONSTRAINT "food_nutritions_foodId_fkey";

-- DropIndex
DROP INDEX "food_nutrition_values_nutritionId_componentId_key";

-- AlterTable
ALTER TABLE "daily_logs" DROP COLUMN "targetCalories",
DROP COLUMN "targetCarbs",
DROP COLUMN "targetFat",
DROP COLUMN "targetFiber",
DROP COLUMN "targetProtein",
DROP COLUMN "totalCalories",
DROP COLUMN "totalCarbs",
DROP COLUMN "totalFat",
DROP COLUMN "totalFiber",
DROP COLUMN "totalProtein",
DROP COLUMN "status",
ADD COLUMN     "status" "StatusType" NOT NULL DEFAULT 'BELOW';

-- AlterTable
ALTER TABLE "food_categories" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "food_images" DROP COLUMN "mealItemId",
ADD COLUMN     "mealId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "food_nutrition_values" DROP COLUMN "componentId",
DROP COLUMN "createdAt",
DROP COLUMN "nutritionId",
DROP COLUMN "updatedAt",
ADD COLUMN     "foodNutritionProfileId" INTEGER NOT NULL,
ADD COLUMN     "nutrientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "foods" DROP COLUMN "calories",
DROP COLUMN "carbs",
DROP COLUMN "fat",
DROP COLUMN "fiber",
DROP COLUMN "foodType",
DROP COLUMN "protein";

-- AlterTable
ALTER TABLE "meals" DROP COLUMN "totalCalories",
DROP COLUMN "mealType",
ADD COLUMN     "mealType" "MealType" NOT NULL;

-- AlterTable
ALTER TABLE "nutrition_goals" DROP COLUMN "startDate",
DROP COLUMN "targetCaloriesPerDay",
DROP COLUMN "targetCarbsPerDay",
DROP COLUMN "targetFatPerDay",
DROP COLUMN "targetProteinPerDay",
ADD COLUMN     "startDay" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "targetCalories" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "targetCarbs" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "targetFat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "targetProtein" DOUBLE PRECISION NOT NULL,
DROP COLUMN "goalType",
ADD COLUMN     "goalType" "GoalType" NOT NULL;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "allergies",
DROP COLUMN "activityLevel",
ADD COLUMN     "activityLevel" "ActivityLevel";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "birthOfDate",
DROP COLUMN "genderCode",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- DropTable
DROP TABLE "dish_ingredients";

-- DropTable
DROP TABLE "food_nutritions";

-- DropTable
DROP TABLE "nutrition_components";

-- CreateTable
CREATE TABLE "user_allergies" (
    "id" SERIAL NOT NULL,
    "severity" "SeverityType" NOT NULL,
    "note" TEXT,
    "userId" INTEGER NOT NULL,
    "allergenId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergens" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_nutrition_profiles" (
    "id" SERIAL NOT NULL,
    "source" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "isCalculated" BOOLEAN NOT NULL DEFAULT false,
    "foodId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_nutrition_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_nutritions" (
    "id" SERIAL NOT NULL,
    "servingSize" DOUBLE PRECISION NOT NULL,
    "servingUnit" "UnitType" NOT NULL DEFAULT 'UNIT_G',
    "source" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "isCalculated" BOOLEAN NOT NULL DEFAULT false,
    "ingredientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_nutritions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "UnitType" NOT NULL,

    CONSTRAINT "nutrients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_values" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "ingredientNutritionId" INTEGER NOT NULL,
    "nutrientId" INTEGER NOT NULL,

    CONSTRAINT "nutrition_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_ingredients" (
    "id" SERIAL NOT NULL,
    "quantityGrams" DOUBLE PRECISION NOT NULL,
    "foodId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_allergens" (
    "id" SERIAL NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "allergenId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "timeRangeStart" TIMESTAMP(3) NOT NULL,
    "timeRangeEnd" TIMESTAMP(3) NOT NULL,
    "data" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "accuracy" DECIMAL(65,30) NOT NULL,
    "loss" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_training_jobs" (
    "id" SERIAL NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "modelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_training_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_allergies_userId_allergenId_key" ON "user_allergies"("userId", "allergenId");

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "allergens"("name");

-- CreateIndex
CREATE UNIQUE INDEX "food_nutrition_profiles_foodId_key" ON "food_nutrition_profiles"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "nutrients_name_key" ON "nutrients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_values_ingredientNutritionId_nutrientId_key" ON "nutrition_values"("ingredientNutritionId", "nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "food_ingredients_foodId_ingredientId_key" ON "food_ingredients"("foodId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_allergens_ingredientId_allergenId_key" ON "ingredient_allergens"("ingredientId", "allergenId");

-- CreateIndex
CREATE UNIQUE INDEX "food_nutrition_values_foodNutritionProfileId_nutrientId_key" ON "food_nutrition_values"("foodNutritionProfileId", "nutrientId");

-- CreateIndex
CREATE INDEX "foods_foodName_idx" ON "foods"("foodName");

-- AddForeignKey
ALTER TABLE "user_allergies" ADD CONSTRAINT "user_allergies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergies" ADD CONSTRAINT "user_allergies_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "allergens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_nutrition_profiles" ADD CONSTRAINT "food_nutrition_profiles_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_nutrition_values" ADD CONSTRAINT "food_nutrition_values_foodNutritionProfileId_fkey" FOREIGN KEY ("foodNutritionProfileId") REFERENCES "food_nutrition_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_nutrition_values" ADD CONSTRAINT "food_nutrition_values_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "nutrients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_nutritions" ADD CONSTRAINT "ingredient_nutritions_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_values" ADD CONSTRAINT "nutrition_values_ingredientNutritionId_fkey" FOREIGN KEY ("ingredientNutritionId") REFERENCES "ingredient_nutritions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_values" ADD CONSTRAINT "nutrition_values_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "nutrients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ingredients" ADD CONSTRAINT "food_ingredients_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_ingredients" ADD CONSTRAINT "food_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_images" ADD CONSTRAINT "food_images_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_images" ADD CONSTRAINT "food_images_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_training_jobs" ADD CONSTRAINT "ai_training_jobs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
