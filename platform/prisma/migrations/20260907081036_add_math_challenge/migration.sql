-- CreateTable
CREATE TABLE "math_challenges" (
    "id" TEXT NOT NULL,
    "answer" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "math_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "math_challenges_expiresAt_idx" ON "math_challenges"("expiresAt");
