# 014 — DevOps & Security Providers

## Status: queued

## Objective
Implement providers for DevOps tools (Datadog, PagerDuty, Docker Hub, npm) and security feeds (CISA KEV, NVD, Cloudflare Radar).

## Requirements
- **Statuspage-based** (extend `BaseStatuspageProvider`):
  - `src/lib/providers/datadog.ts` — `https://status.datadoghq.com` — category: `devops`, tier: `slow`
  - `src/lib/providers/pagerduty.ts` — `https://status.pagerduty.com` — category: `devops`, tier: `slow`

- **Custom providers**:
  - `src/lib/providers/dockerhub.ts`:
    - Source: `https://www.dockerstatus.com` (Statuspage) or Docker status API
    - Category: `devops`, tier: `slow`
  - `src/lib/providers/npm-registry.ts`:
    - Source: `https://status.npmjs.org` (Statuspage)
    - Category: `devops`, tier: `slow`

- **Security providers** (extend `BaseJSONProvider`):
  - `src/lib/providers/cisa-kev.ts`:
    - Feed: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
    - Maps CVE entries to alerts with severity based on due date urgency
    - Category: `security`, tier: `slow`
  - `src/lib/providers/nvd.ts`:
    - REST API: `https://services.nvd.nist.gov/rest/json/cves/2.0`
    - Filter for recently published/modified, high severity (CVSS >= 7.0)
    - Optional API key for higher rate limits (NVD_API_KEY)
    - Category: `security`, tier: `slow`

- **ISP provider**:
  - `src/lib/providers/cloudflare-radar.ts`:
    - REST API: `https://api.cloudflare.com/client/v4/radar/...`
    - Requires CLOUDFLARE_RADAR_API_KEY (free)
    - Fetch internet outage summaries
    - Category: `isp`, tier: `slow`

- Register all in provider registry

## Acceptance Criteria
- [ ] All 7 providers implemented and tested
- [ ] Security providers correctly map CVE data to alert format
- [ ] Cloudflare Radar handles API key auth
- [ ] NVD respects rate limits (with/without API key)
- [ ] All registered in registry
- [ ] Commit: "feat: add DevOps, security, and ISP providers"

## Completion Notes
_(to be filled after task completion)_
