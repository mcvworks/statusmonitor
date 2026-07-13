-- CreateTable
CREATE TABLE "EmailSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "severityFilter" TEXT NOT NULL DEFAULT '[]',
    "sourceFilter" TEXT NOT NULL DEFAULT '[]',
    "pendingSeverityFilter" TEXT,
    "pendingSourceFilter" TEXT,
    "confirmationTokenHash" TEXT,
    "confirmationExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailSubscriptionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    CONSTRAINT "EmailSubscriptionLog_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "EmailSubscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailSubscriptionLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSubscription_email_key" ON "EmailSubscription"("email");
CREATE UNIQUE INDEX "EmailSubscription_confirmationTokenHash_key" ON "EmailSubscription"("confirmationTokenHash");
CREATE UNIQUE INDEX "EmailSubscriptionLog_subscriptionId_alertId_eventKey_key" ON "EmailSubscriptionLog"("subscriptionId", "alertId", "eventKey");
CREATE INDEX "EmailSubscriptionLog_subscriptionId_sentAt_idx" ON "EmailSubscriptionLog"("subscriptionId", "sentAt");
