CREATE TABLE "BrowserPushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "severityFilter" TEXT NOT NULL DEFAULT '[]',
    "sourceFilter" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "BrowserPushLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    CONSTRAINT "BrowserPushLog_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BrowserPushSubscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BrowserPushLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BrowserPushSubscription_endpoint_key" ON "BrowserPushSubscription"("endpoint");
CREATE UNIQUE INDEX "BrowserPushLog_subscriptionId_alertId_eventKey_key" ON "BrowserPushLog"("subscriptionId", "alertId", "eventKey");
