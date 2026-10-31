-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "applicationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "applicationTokenHash" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'ADMIN';

