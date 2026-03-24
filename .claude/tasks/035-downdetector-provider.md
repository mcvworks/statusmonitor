# 035 — Downdetector Crowdsourced Signals

## Status: queued

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
- [ ] Downdetector provider fetches crowdsourced data (or links)
- [ ] Report spikes generate alerts with appropriate severity
- [ ] Downdetector links appear in AlertCard for mapped providers
- [ ] Provider registered in polling scheduler (slow tier)
- [ ] Graceful handling when Downdetector is unreachable

## Completion Notes
