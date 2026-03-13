# 009 — RSS Providers (AWS, Azure, M365)

## Status: queued

## Objective
Implement providers that consume RSS/Atom feeds for AWS, Azure, and Microsoft 365 status pages.

## Requirements
- Create `src/lib/providers/aws.ts`:
  - Extends `BaseRSSProvider`
  - Feed URL: `https://status.aws.amazon.com/rss/all.rss`
  - Parse AWS-specific format: service name from title, region from description
  - Category: `cloud`, Poll tier: `fast`
- Create `src/lib/providers/azure.ts`:
  - Feed URL: `https://azure.status.microsoft/en-us/status/feed/`
  - Parse Azure service/region info from feed items
  - Category: `cloud`, Poll tier: `fast`
- Create `src/lib/providers/m365.ts`:
  - Feed URL: Microsoft 365 Service health RSS (or use the public status page feed)
  - Category: `cloud`, Poll tier: `fast`
- Each provider implements `mapItem()` to convert RSS items to `AlertInput`
- Handle provider-specific quirks:
  - AWS uses HTML in description, may need sanitization
  - Azure may have multi-region incidents
  - M365 uses different severity terminology
- Register all in provider registry
- Test via debug route

## Acceptance Criteria
- [ ] All 3 providers fetch and parse their RSS feeds
- [ ] Provider-specific parsing handles format quirks
- [ ] Timestamps parsed correctly across timezones
- [ ] Registered in provider registry
- [ ] Debug route confirms working data
- [ ] Commit: "feat: add RSS providers (AWS, Azure, M365)"

## Completion Notes
_(to be filled after task completion)_
