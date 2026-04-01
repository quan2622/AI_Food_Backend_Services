/*
  Warnings:

  - Added the required column `grams` to the `meal_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "foods" ADD COLUMN     "defaultServingGrams" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "meal_items" ADD COLUMN     "grams" DOUBLE PRECISION NOT NULL;
