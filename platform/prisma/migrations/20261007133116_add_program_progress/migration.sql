-- CreateTable
CREATE TABLE "program_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programSlug" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_item_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programSlug" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_item_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_day_reflections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programSlug" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "feeling" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_day_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_enrollments_userId_programSlug_key" ON "program_enrollments"("userId", "programSlug");

-- CreateIndex
CREATE INDEX "program_item_completions_userId_programSlug_idx" ON "program_item_completions"("userId", "programSlug");

-- CreateIndex
CREATE UNIQUE INDEX "program_item_completions_userId_programSlug_itemId_key" ON "program_item_completions"("userId", "programSlug", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "program_day_reflections_userId_programSlug_day_key" ON "program_day_reflections"("userId", "programSlug", "day");

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_item_completions" ADD CONSTRAINT "program_item_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_day_reflections" ADD CONSTRAINT "program_day_reflections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
