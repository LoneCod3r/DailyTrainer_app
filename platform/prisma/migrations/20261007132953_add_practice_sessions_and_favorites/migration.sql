-- CreateEnum
CREATE TYPE "PracticeSessionSource" AS ENUM ('APP', 'DEVICE_IMPORT');

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "practiceSlug" TEXT NOT NULL,
    "source" "PracticeSessionSource" NOT NULL DEFAULT 'APP',
    "durationSec" INTEGER,
    "localDate" TEXT NOT NULL,
    "preFeelings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postFeeling" TEXT,
    "note" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_practices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "practiceSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_practices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "practice_sessions_userId_completedAt_idx" ON "practice_sessions"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "practice_sessions_userId_localDate_idx" ON "practice_sessions"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "practice_sessions_userId_clientId_key" ON "practice_sessions"("userId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_practices_userId_practiceSlug_key" ON "favorite_practices"("userId", "practiceSlug");

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_practices" ADD CONSTRAINT "favorite_practices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
