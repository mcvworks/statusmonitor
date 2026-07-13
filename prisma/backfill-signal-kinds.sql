-- Idempotent production backfill for databases historically managed with
-- `prisma db push`, which updates structure without running migration SQL.
UPDATE "Alert"
SET "signalKind" = 'advisory'
WHERE "source" IN ('cisa-kev', 'nvd')
  AND "signalKind" = 'incident';

UPDATE "Alert"
SET "signalKind" = 'internet_outage', "confidence" = 'observed'
WHERE "source" = 'cloudflare-radar'
  AND "signalKind" = 'incident';

UPDATE "Alert"
SET "signalKind" = 'community_signal', "confidence" = 'crowdsourced'
WHERE "source" = 'downdetector'
  AND "signalKind" = 'incident';
