-- CreateEnum
CREATE TYPE "LeadEmailKind" AS ENUM ('OWNER_NOTICE', 'CUSTOMER_RECEIPT');

-- CreateEnum
CREATE TYPE "LeadEmailStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'PREVIEW');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "submissionHash" TEXT,
ADD COLUMN     "submissionKey" TEXT;

-- CreateTable
CREATE TABLE "LeadEmail" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "kind" "LeadEmailKind" NOT NULL,
    "status" "LeadEmailStatus" NOT NULL DEFAULT 'PENDING',
    "mode" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "replyTo" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "messageId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadEmail_status_createdAt_idx" ON "LeadEmail"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEmail_leadId_kind_key" ON "LeadEmail"("leadId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_submissionKey_key" ON "Lead"("submissionKey");

-- AddForeignKey
ALTER TABLE "LeadEmail" ADD CONSTRAINT "LeadEmail_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
