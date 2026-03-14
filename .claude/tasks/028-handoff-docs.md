# 028 — Handoff Documentation

## Status: done

## Objective
Create comprehensive documentation for deploying, operating, and extending StatusMonitor.

## Requirements
- Create `README.md`:
  - Project overview and screenshot/description
  - Features list (public + authenticated)
  - Quick start (local dev)
  - Tech stack summary
  - Links to detailed docs below

- Create `docs/DEPLOYMENT.md`:
  - Prerequisites (Docker, domain, OAuth app setup)
  - Subdomain setup:
    - DNS: Add `CNAME` or `A` record for `monitor.ducktyped.com` pointing to VM IP
    - Nginx reverse proxy config for the subdomain (reference `nginx/monitor.conf`)
    - SSL via Let's Encrypt / Certbot for `monitor.ducktyped.com`
    - Set `NEXTAUTH_URL=https://monitor.ducktyped.com` in .env
  - Step-by-step OAuth setup for each provider (use `monitor.ducktyped.com` as callback domain):
    - Google Cloud Console → OAuth credentials
    - Microsoft Entra ID → App registration
    - Apple Developer → Sign in with Apple
    - GitHub → OAuth App settings
  - Environment variables reference (every var, required vs optional, description)
  - Docker deployment on common VMs (DigitalOcean, AWS EC2, Linode)
  - VAPID key generation
  - Resend/SMTP setup
  - First run checklist

- Create `docs/CROSS-LINKING.md`:
  - How StatusMonitor and Ducktyped are connected (subdomain strategy, shared org identity)
  - Adding the toolbar link on Ducktyped:
    - Where to add it in Ducktyped's HTML (nav/toolbar section)
    - Exact markup: `<a href="https://monitor.ducktyped.com">Service Status Monitor</a>`
    - Anchor text guidance: descriptive text, no `nofollow`, optional tooltip
  - StatusMonitor footer backlink to Ducktyped
  - SEO checklist:
    - Both sites submit separate sitemaps to Google Search Console
    - Both share `Organization` JSON-LD with matching entity
    - Canonical URLs set correctly on both
    - No `nofollow` on cross-links (they're first-party)
  - Google Search Console: add `monitor.ducktyped.com` as a separate property

- Create `docs/ARCHITECTURE.md`:
  - System architecture diagram (text-based)
  - Data flow: providers → polling engine → dedup → DB → SSE → UI
  - Notification flow: new alert → dispatcher → channels
  - Blast radius flow: alert → dependency resolver → UI
  - Database schema overview
  - Auth flow
  - Key design decisions and rationale

- Create `docs/ADDING-PROVIDERS.md`:
  - Step-by-step guide to add a new status provider
  - Which base class to extend
  - Required methods to implement
  - How to register in the provider registry
  - How to add to the dependency map
  - Example: adding a new Statuspage provider (5 lines of code)

- Create `docs/API.md`:
  - All API endpoints with request/response examples
  - Authentication requirements per endpoint
  - Query parameter documentation
  - Error response format

## Acceptance Criteria
- [x] README provides clear project overview and quick start
- [x] Deployment guide covers OAuth setup for all 5 providers
- [x] Environment variable reference is complete
- [x] Architecture doc explains all data flows
- [x] Adding providers guide enables extension without reading source
- [x] API reference covers all endpoints
- [x] Cross-linking doc covers subdomain strategy and Ducktyped integration
- [x] All docs committed and pushed
- [x] Commit: "docs: add comprehensive handoff documentation"

## Completion Notes
Created comprehensive handoff documentation:

- **README.md** — Replaced default Next.js README with project overview, features, quick start, tech stack, and links to detailed docs
- **docs/DEPLOYMENT.md** — Full deployment guide covering DNS, nginx, SSL, OAuth setup for all 4 providers + magic link, complete env var reference, VAPID key generation, Docker deployment on common VMs, and first-run checklist
- **docs/ARCHITECTURE.md** — System architecture diagram, data flow from providers through polling/dedup/DB/SSE to UI, notification flow, blast radius flow, database schema overview, auth flow, and key design decisions with rationale
- **docs/ADDING-PROVIDERS.md** — Step-by-step guide for all 3 base classes with full code examples, registration instructions, dependency map integration, and provider interface reference
- **docs/API.md** — All 17 API endpoints documented with auth requirements, query parameters, request/response examples, and error format
- **docs/CROSS-LINKING.md** — Subdomain strategy, Ducktyped toolbar link markup, footer backlink, SEO checklist covering sitemaps, structured data, canonical URLs, and Search Console setup
