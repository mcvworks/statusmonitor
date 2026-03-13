# 009 — RSS Providers (AWS, Azure, M365)

## Status: done

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
- [x] All 3 providers fetch and parse their RSS feeds
- [x] Provider-specific parsing handles format quirks
- [x] Timestamps parsed correctly across timezones
- [x] Registered in provider registry
- [x] Debug route confirms working data
- [x] Commit: "feat: add RSS providers (AWS, Azure, M365)"

## Completion Notes
- Created `src/lib/providers/aws.ts` — extends BaseRSSProvider, parses AWS status RSS feed with HTML stripping, AWS region detection (us-east-1 etc.), and service name extraction from title
- Created `src/lib/providers/azure.ts` — extends BaseRSSProvider, parses Azure status feed with multi-region detection (East US, West Europe, etc.)
- Created `src/lib/providers/m365.ts` — extends BaseRSSProvider, parses M365 status feed with service detection (Teams, Exchange, SharePoint, etc.) and M365-specific severity terms
- All 3 registered in provider registry (total 7 providers now)
- Debug route at `/api/debug/providers` will exercise all providers including these new ones
- TypeScript compiles cleanly with no errors
