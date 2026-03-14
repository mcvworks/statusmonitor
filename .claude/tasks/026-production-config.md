# 026 — Production Config & Healthcheck

## Status: done

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
- [x] Health endpoint returns comprehensive status
- [x] Docker healthcheck configured and working
- [x] Security headers set on all responses
- [x] Graceful shutdown stops all background tasks
- [x] Data cleanup job runs daily
- [x] Rate limiting on auth routes
- [x] Sitemap and robots.txt generated correctly
- [x] Canonical URLs set on all pages
- [x] OG/Twitter Card meta tags present
- [x] JSON-LD structured data matches Ducktyped org
- [x] Commit: "feat: add production config, healthcheck, and security hardening"

## Completion Notes
- Health endpoint at `/api/health` returns status, uptime, version, provider health from PollLog, and DB connectivity; returns 503 if DB is down
- Docker healthcheck added with `curl -f`, 30s interval, 10s timeout, 3 retries, 30s start period; added `curl` to Dockerfile runner stage
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, CSP) via `next.config.ts` headers()
- Graceful shutdown in `instrumentation.ts` handles SIGTERM/SIGINT: stops scheduler, cleanup job, removes event bus listeners, disconnects Prisma
- Daily cleanup job at 03:00 UTC via node-cron: purges resolved alerts >30 days, poll logs >7 days, notification logs >30 days
- In-memory rate limiting on `/api/auth` endpoints: 20 req/min per IP with automatic cleanup
- SEO: `sitemap.ts` (public pages), `robots.ts` (disallow api/dashboard/auth), canonical URLs via `metadataBase`, OG + Twitter Card meta tags, JSON-LD Organization structured data preserved
