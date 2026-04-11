/*
  Warnings:

  - You are about to drop the column `loss` on the `ai_models` table. All the data in the column will be lost.
  - You are about to drop the column `modelId` on the `ai_training_jobs` table. All the data in the column will be lost.
  - The `status` column on the `ai_training_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gender` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `workout_logs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[trainingJobId]` on the table `ai_models` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `modelName` to the `ai_models` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelName` to the `ai_training_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `triggeredById` to the `ai_training_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('MALE', 'FEMALE', 'UNDEFINED');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('REPORT', 'CONTRIBUTION');

-- CreateEnum
CREATE TYPE "SubmissionCategory" AS ENUM ('WRONG_INFO', 'BAD_IMAGE', 'NEW_FOOD', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AITrainingJobStatus" AS ENUM ('TRAIN_PENDING', 'TRAIN_PREPARING', 'TRAIN_RUNNING', 'TRAIN_DONE', 'TRAIN_FAILED', 'TRAIN_CANCELLED');

-- DropForeignKey
ALTER TABLE "ai_training_jobs" DROP CONSTRAINT "ai_training_jobs_modelId_fkey";

-- DropForeignKey
ALTER TABLE "workout_logs" DROP CONSTRAINT "workout_logs_userId_fkey";

-- AlterTable
ALTER TABLE "ai_models" DROP COLUMN "loss",
ADD COLUMN     "bestEpoch" INTEGER,
ADD COLUMN     "classNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "modelFilePath" TEXT,
ADD COLUMN     "modelName" TEXT NOT NULL,
ADD COLUMN     "numClasses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trainingJobId" INTEGER,
ADD COLUMN     "valLoss" DECIMAL(65,30),
ALTER COLUMN "accuracy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ai_training_jobs" DROP COLUMN "modelId",
ADD COLUMN     "classNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "datasetPath" TEXT,
ADD COLUMN     "datasetZipUrl" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "logText" TEXT,
ADD COLUMN     "metrics" JSONB,
ADD COLUMN     "modelName" TEXT NOT NULL,
ADD COLUMN     "numClasses" INTEGER,
ADD COLUMN     "outputModelPath" TEXT,
ADD COLUMN     "testSize" INTEGER,
ADD COLUMN     "trainSize" INTEGER,
ADD COLUMN     "triggeredById" INTEGER NOT NULL,
ADD COLUMN     "valSize" INTEGER,
ALTER COLUMN "startedAt" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "AITrainingJobStatus" NOT NULL DEFAULT 'TRAIN_PENDING';

-- AlterTable
ALTER TABLE "food_categories" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "nutrients" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "gender",
ADD COLUMN     "gender" "GenderType" NOT NULL DEFAULT 'UNDEFINED';

-- DropTable
DROP TABLE "workout_logs";

-- CreateTable
CREATE TABLE "user_submissions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "targetFoodId" INTEGER,
    "category" "SubmissionCategory" NOT NULL,
    "payload" JSONB NOT NULL,
    "description" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_submissions_userId_idx" ON "user_submissions"("userId");

-- CreateIndex
CREATE INDEX "user_submissions_type_idx" ON "user_submissions"("type");

-- CreateIndex
CREATE INDEX "user_submissions_status_idx" ON "user_submissions"("status");

-- CreateIndex
CREATE INDEX "user_submissions_targetFoodId_idx" ON "user_submissions"("targetFoodId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_trainingJobId_key" ON "ai_models"("trainingJobId");

-- CreateIndex
CREATE INDEX "ai_training_jobs_status_idx" ON "ai_training_jobs"("status");

-- CreateIndex
CREATE INDEX "ai_training_jobs_triggeredById_idx" ON "ai_training_jobs"("triggeredById");

-- AddForeignKey
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_targetFoodId_fkey" FOREIGN KEY ("targetFoodId") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_trainingJobId_fkey" FOREIGN KEY ("trainingJobId") REFERENCES "ai_training_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_training_jobs" ADD CONSTRAINT "ai_training_jobs_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
