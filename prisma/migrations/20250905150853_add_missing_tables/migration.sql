/*
  Warnings:

  - You are about to drop the column `text` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `correct` on the `StudentAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `StudentAnswer` table. All the data in the column will be lost.
  - Added the required column `question` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Question` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `createdById` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quizAttemptId` to the `StudentAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Provider" AS ENUM ('GOOGLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('MCQ', 'TrueFalse', 'Written');

-- DropForeignKey
ALTER TABLE "public"."StudentAnswer" DROP CONSTRAINT "StudentAnswer_studentId_fkey";

-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "text",
ADD COLUMN     "question" TEXT NOT NULL,
ADD COLUMN     "score" DOUBLE PRECISION NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."QuestionType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Quiz" ADD COLUMN     "createdById" INTEGER NOT NULL,
ADD COLUMN     "groupId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."StudentAnswer" DROP COLUMN "correct",
DROP COLUMN "studentId",
ADD COLUMN     "quizAttemptId" INTEGER NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0,
ALTER COLUMN "score" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."Account" (
    "userId" INTEGER NOT NULL,
    "provider" "public"."Provider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","userId")
);

-- CreateTable
CREATE TABLE "public"."QuizAttempt" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quiz" ADD CONSTRAINT "Quiz_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quiz" ADD CONSTRAINT "Quiz_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentAnswer" ADD CONSTRAINT "StudentAnswer_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "public"."QuizAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
