-- CreateTable
CREATE TABLE "DonationApprovalToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "donationId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "action" TEXT,
    "actedByIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationApprovalToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationApprovalToken_tokenHash_key" ON "DonationApprovalToken"("tokenHash");

-- CreateIndex
CREATE INDEX "DonationApprovalToken_donationId_idx" ON "DonationApprovalToken"("donationId");

-- CreateIndex
CREATE INDEX "DonationApprovalToken_expiresAt_idx" ON "DonationApprovalToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "DonationApprovalToken" ADD CONSTRAINT "DonationApprovalToken_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
