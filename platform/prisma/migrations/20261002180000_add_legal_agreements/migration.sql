-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS', 'PRIVACY', 'COOKIES');

-- CreateEnum
CREATE TYPE "LegalAgreementAction" AS ENUM ('ACCEPTED', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "LegalAgreementSource" AS ENUM ('REGISTRATION');

-- CreateTable
CREATE TABLE "legal_agreements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "action" "LegalAgreementAction" NOT NULL,
    "locale" TEXT NOT NULL,
    "source" "LegalAgreementSource" NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legal_agreements_userId_documentType_idx" ON "legal_agreements"("userId", "documentType");

-- CreateIndex
CREATE INDEX "legal_agreements_documentType_documentVersion_idx" ON "legal_agreements"("documentType", "documentVersion");

-- AddForeignKey
ALTER TABLE "legal_agreements" ADD CONSTRAINT "legal_agreements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

