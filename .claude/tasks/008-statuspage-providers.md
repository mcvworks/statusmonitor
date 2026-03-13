# 008 — Statuspage Providers (Cloudflare, GitHub, Atlassian, Slack)

## Status: done

## Objective
Implement the first batch of providers using the Statuspage API pattern. These all use the same Atlassian Statuspage format.

## Requirements
- Create `src/lib/providers/cloudflare.ts`:
  - Extends `BaseStatuspageProvider`
  - Base URL: `https://www.cloudflarestatus.com`
  - Category: `cloud`, Poll tier: `fast`
- Create `src/lib/providers/github.ts`:
  - Base URL: `https://www.githubstatus.com`
  - Category: `cloud`, Poll tier: `fast`
- Create `src/lib/providers/atlassian.ts`:
  - Base URL: `https://status.atlassian.com`
  - Category: `cloud`, Poll tier: `fast`
  - Covers Jira, Confluence, Bitbucket
- Create `src/lib/providers/slack-status.ts`:
  - Base URL: `https://status.slack.com` (note: Slack uses Statuspage)
  - Category: `cloud`, Poll tier: `fast`
- Register all 4 in the provider registry
- Test each provider manually:
  - Create a simple test script or API route (`/api/debug/providers`) that runs each provider and returns results
  - Verify alert mapping (severity, title, timestamps, external IDs)

## Acceptance Criteria
- [x] All 4 providers fetch real data from their status pages
- [x] Alerts are correctly mapped to `AlertInput` format
- [x] Severity mapping is consistent across providers
- [x] Providers handle network errors gracefully
- [x] All registered in provider registry
- [x] Debug route shows live results
- [x] Commit: "feat: add Statuspage providers (Cloudflare, GitHub, Atlassian, Slack)"

## Completion Notes
- Created 4 statuspage providers extending `BaseStatuspageProvider`: Cloudflare, GitHub, Atlassian, Slack
- Each provider configured with correct base URL, category (`cloud`), and poll tier (`fast`)
- All providers registered in `src/lib/providers/registry.ts` on import
- Created `/api/debug/providers` route that polls all registered providers and returns live results with timing info
- All severity/status mapping inherited from `BaseStatuspageProvider` (consistent across all 4)
- Error handling inherited from base class (10s timeout, returns empty array on failure)
