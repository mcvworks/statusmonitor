-- AlterTable
ALTER TABLE "Alert" ADD COLUMN "signalKind" TEXT NOT NULL DEFAULT 'incident';
ALTER TABLE "Alert" ADD COLUMN "confidence" TEXT NOT NULL DEFAULT 'official';
ALTER TABLE "Alert" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "Alert" ADD COLUMN "lastObservedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PollLog" ADD COLUMN "updatedAlerts" INTEGER NOT NULL DEFAULT 0;

-- Backfill pre-existing records so advisories and observations do not affect
-- operational service health after deployment.
UPDATE "Alert" SET "signalKind" = 'advisory' WHERE "category" = 'security';
UPDATE "Alert" SET "signalKind" = 'internet_outage', "confidence" = 'observed' WHERE "source" = 'cloudflare-radar';
UPDATE "Alert" SET "signalKind" = 'community_signal', "confidence" = 'crowdsourced' WHERE "source" = 'downdetector';

-- CreateTable
CREATE TABLE "ProviderState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "lastAttemptAt" DATETIME NOT NULL,
    "lastSuccessAt" DATETIME,
    "lastErrorAt" DATETIME,
    "lastError" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastAlertCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "ProviderState_provider_key" ON "ProviderState"("provider");

-- CreateTable
CREATE TABLE "AlertUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL,
    "sourceTimestamp" DATETIME NOT NULL,
    "status" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertUpdate_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AlertUpdate_alertId_sourceTimestamp_body_key" ON "AlertUpdate"("alertId", "sourceTimestamp", "body");
CREATE INDEX "AlertUpdate_alertId_sourceTimestamp_idx" ON "AlertUpdate"("alertId", "sourceTimestamp");
