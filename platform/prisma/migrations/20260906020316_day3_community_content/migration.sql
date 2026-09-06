-- CreateEnum
CREATE TYPE "DiscussionCategory" AS ENUM ('GENERAL', 'PRACTICES', 'PROGRAMS', 'KUKO_WAY', 'COMMUNITY', 'QUESTIONS');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PUBLISHED', 'PENDING', 'HIDDEN', 'REMOVED');

-- AlterTable
ALTER TABLE "content_items" ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "discussions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "DiscussionCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "ModerationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_replies" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discussions_slug_key" ON "discussions"("slug");

-- CreateIndex
CREATE INDEX "discussions_category_status_idx" ON "discussions"("category", "status");

-- CreateIndex
CREATE INDEX "discussions_status_idx" ON "discussions"("status");

-- CreateIndex
CREATE INDEX "discussion_replies_discussionId_idx" ON "discussion_replies"("discussionId");

-- CreateIndex
CREATE INDEX "lesson_progress_userId_courseSlug_idx" ON "lesson_progress"("userId", "courseSlug");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_userId_courseSlug_moduleSlug_lessonSlug_key" ON "lesson_progress"("userId", "courseSlug", "moduleSlug", "lessonSlug");

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
