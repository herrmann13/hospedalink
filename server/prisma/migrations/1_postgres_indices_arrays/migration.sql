-- AlterTable
ALTER TABLE "AccommodationRequest" DROP COLUMN "accommodationPreference",
ADD COLUMN     "accommodationPreference" TEXT[];

-- CreateIndex
CREATE INDEX "AccommodationRequest_companyId_idx" ON "AccommodationRequest"("companyId");

-- CreateIndex
CREATE INDEX "AccommodationRequest_status_idx" ON "AccommodationRequest"("status");

-- CreateIndex
CREATE INDEX "AccommodationRequirement_requestId_idx" ON "AccommodationRequirement"("requestId");

-- CreateIndex
CREATE INDEX "Contract_requestId_idx" ON "Contract"("requestId");

-- CreateIndex
CREATE INDEX "Contract_companyId_idx" ON "Contract"("companyId");

-- CreateIndex
CREATE INDEX "Contract_partnerId_idx" ON "Contract"("partnerId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Negotiation_requestId_idx" ON "Negotiation"("requestId");

-- CreateIndex
CREATE INDEX "Negotiation_partnerId_idx" ON "Negotiation"("partnerId");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "Partner_category_idx" ON "Partner"("category");

-- CreateIndex
CREATE INDEX "PartnerImage_partnerId_idx" ON "PartnerImage"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerService_partnerId_idx" ON "PartnerService"("partnerId");

-- CreateIndex
CREATE INDEX "Proposal_requestId_idx" ON "Proposal"("requestId");

-- CreateIndex
CREATE INDEX "Proposal_partnerId_idx" ON "Proposal"("partnerId");

-- CreateIndex
CREATE INDEX "Proposal_negotiationId_idx" ON "Proposal"("negotiationId");

-- CreateIndex
CREATE INDEX "RoomType_partnerId_idx" ON "RoomType"("partnerId");

