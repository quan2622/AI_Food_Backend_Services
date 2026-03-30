/*
  Warnings:

  - You are about to drop the column `startDay` on the `nutrition_goals` table. All the data in the column will be lost.
  - Added the required column `startDate` to the `nutrition_goals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "nutrition_goals" DROP COLUMN "startDay",
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;
