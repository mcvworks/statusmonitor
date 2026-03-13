# 008 — Statuspage Providers (Cloudflare, GitHub, Atlassian, Slack)

## Status: queued

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
- [ ] All 4 providers fetch real data from their status pages
- [ ] Alerts are correctly mapped to `AlertInput` format
- [ ] Severity mapping is consistent across providers
- [ ] Providers handle network errors gracefully
- [ ] All registered in provider registry
- [ ] Debug route shows live results
- [ ] Commit: "feat: add Statuspage providers (Cloudflare, GitHub, Atlassian, Slack)"

## Completion Notes
_(to be filled after task completion)_
