# 026 — Production Config & Healthcheck

## Status: queued

## Objective
Add production hardening: healthcheck endpoint, graceful shutdown, log management, and security headers.

## Requirements
- Create `src/app/api/health/route.ts`:
  - GET: Returns `{ status: "ok", uptime, version, providers: { total, healthy, errored }, lastPoll, dbConnected }`
  - Checks DB connectivity
  - Reports provider health from recent PollLog entries
  - Returns 503 if critical checks fail
- Update `docker-compose.yml`:
  - Add healthcheck: `curl -f http://localhost:3000/api/health`
  - Interval: 30s, timeout: 10s, retries: 3
- Add `next.config.ts` security headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy (basic)
- Add graceful shutdown handling:
  - Stop scheduler on SIGTERM/SIGINT
  - Close SSE connections
  - Close Prisma connection
- Create alert cleanup job:
  - Delete resolved alerts older than configurable retention (default 30 days)
  - Delete old PollLog entries (default 7 days)
  - Delete old NotificationLog entries (default 30 days)
  - Runs daily via node-cron
- Rate limiting on auth endpoints (basic in-memory or via middleware)
- SEO configuration:
  - `src/app/sitemap.ts` — Next.js dynamic sitemap (public pages: `/`, `/history`)
  - `src/app/robots.ts` — robots.txt allowing all crawlers, pointing to sitemap
  - `<link rel="canonical">` on all pages pointing to `https://monitor.ducktyped.com/...`
  - Open Graph + Twitter Card meta tags on all pages (title, description, image)
  - `Organization` JSON-LD structured data matching Ducktyped's entity (same org, different `sameAs` URLs)

## Acceptance Criteria
- [ ] Health endpoint returns comprehensive status
- [ ] Docker healthcheck configured and working
- [ ] Security headers set on all responses
- [ ] Graceful shutdown stops all background tasks
- [ ] Data cleanup job runs daily
- [ ] Rate limiting on auth routes
- [ ] Sitemap and robots.txt generated correctly
- [ ] Canonical URLs set on all pages
- [ ] OG/Twitter Card meta tags present
- [ ] JSON-LD structured data matches Ducktyped org
- [ ] Commit: "feat: add production config, healthcheck, and security hardening"

## Completion Notes
_(to be filled after task completion)_
