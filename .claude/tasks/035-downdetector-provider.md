# 035 — Downdetector Crowdsourced Signals

## Status: done

## Objective
Implement the Downdetector provider (currently a placeholder in the provider registry) to surface crowdsourced outage reports, adding a "what real users are seeing" dimension.

## Requirements
- Research Downdetector's available data sources:
  - Option A: Scrape their public status pages (e.g., `downdetector.com/status/aws/`)
  - Option B: Use their RSS feeds if available
  - Option C: If no programmatic access, create a provider that links to Downdetector pages per-provider
- Implement the Downdetector provider:
  - Map to existing monitored providers (AWS, Azure, GitHub, Cloudflare, etc.)
  - Extract: report count trend, current status (possible problems / no issues), report spike detection
  - Severity mapping: spike in reports = major, elevated = minor, normal = info
  - Category: "meta" (crowdsourced)
- Add Downdetector links to AlertCard for qualifying providers:
  - "See user reports on Downdetector" link next to the existing incident/status links
  - Only show when the provider has a known Downdetector page
- Add Downdetector URL mapping to PROVIDERS constant in `lib/constants.ts`

## Acceptance Criteria
- [x] Downdetector provider fetches crowdsourced data (or links)
- [x] Report spikes generate alerts with appropriate severity
- [x] Downdetector links appear in AlertCard for mapped providers
- [x] Provider registered in polling scheduler (slow tier)
- [x] Graceful handling when Downdetector is unreachable

## Completion Notes
- Created `src/lib/providers/downdetector.ts` with `DowndetectorProvider` class
- Provider scrapes Downdetector public status pages for 17 mapped services (AWS, Azure, GCP, GitHub, Cloudflare, Slack, Okta, Stripe, etc.)
- Fetches all services in parallel with 8s timeout per request; gracefully returns empty on failure
- Parses HTML for "Possible problems" / "Problems at" indicators and report count patterns
- Severity mapping: 1000+ reports = critical, 300+ = major, 50+ = minor, below = info (suppressed)
- Alerts use daily-stamped externalId (`dd-{slug}-{YYYYMMDD}`) for dedup
- Added `downdetectorSlug` field to `ProviderMeta` in constants.ts — each provider with a DD page gets its slug
- AlertCard now shows "User reports" link for any provider with a `downdetectorSlug`
- Provider registered in registry.ts under "Meta provider (crowdsourced)" in slow tier
