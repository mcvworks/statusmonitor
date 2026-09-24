-- This legacy Docker Status.io incident's saved final update explicitly says
-- "Resolved - The system remains stable", followed by "continue monitoring".
-- The old parser treated that final prose word as the lifecycle status.
-- Docker's new feed no longer includes the old ID, so a normal poll cannot
-- correct it. Update only that known row when the original evidence is present.
-- Preserve its observation time; this repair is not a fresh provider observation.
UPDATE "Alert"
SET "status" = 'resolved',
    "resolvedAt" = COALESCE("resolvedAt", "timestamp")
WHERE "source" = 'dockerhub'
  AND "externalId" = '69abf9d290ff0a05853770e2'
  AND "status" = 'monitoring'
  AND "description" LIKE '%Resolved - The system remains stable.%';
