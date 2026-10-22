-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MediaGroup" AS ENUM ('M1', 'M2', 'M3');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'WEBINAR', 'PAST');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('EVENT', 'COMPETITION', 'WEBINAR', 'PAST');

-- CreateEnum
CREATE TYPE "Interest" AS ENUM ('FOUNDATION', 'SECTOR_PROGRAM', 'INHOUSE', 'ELEARNING', 'MEDIA', 'EVENT_SPONSOR');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST', 'SPAM');

-- CreateTable
CREATE TABLE "Law" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Law_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "isFoundation" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorTier" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "introLead" TEXT NOT NULL,
    "introBody" TEXT NOT NULL,

    CONSTRAINT "SectorTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorProgram" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "standards" TEXT NOT NULL,
    "launchPeriod" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SectorProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaService" (
    "id" TEXT NOT NULL,
    "group" "MediaGroup" NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "benefits" TEXT[],
    "meta" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL,
    "kind" "EventKind" NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" TEXT[],
    "ctaLabel" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "scenario" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "answers" INTEGER[],
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "organization" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "sectorProgramId" TEXT,
    "sectorLabel" TEXT,
    "interests" "Interest"[],
    "message" TEXT,
    "eventId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "note" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Law_sortOrder_idx" ON "Law"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_isFoundation_sortOrder_idx" ON "Course"("isFoundation", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SectorTier_level_key" ON "SectorTier"("level");

-- CreateIndex
CREATE UNIQUE INDEX "SectorProgram_name_key" ON "SectorProgram"("name");

-- CreateIndex
CREATE INDEX "SectorProgram_tierId_sortOrder_idx" ON "SectorProgram"("tierId", "sortOrder");

-- CreateIndex
CREATE INDEX "MediaService_group_sortOrder_idx" ON "MediaService"("group", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_sortOrder_idx" ON "Event"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_courseId_position_key" ON "Lesson"("courseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_courseId_position_key" ON "QuizQuestion"("courseId", "position");

-- CreateIndex
CREATE INDEX "QuizAttempt_courseId_createdAt_idx" ON "QuizAttempt"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- AddForeignKey
ALTER TABLE "SectorProgram" ADD CONSTRAINT "SectorProgram_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "SectorTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sectorProgramId_fkey" FOREIGN KEY ("sectorProgramId") REFERENCES "SectorProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

