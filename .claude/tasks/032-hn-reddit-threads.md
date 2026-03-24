# 032 — Hacker News & Reddit Thread Links

## Status: queued

## Objective
When a major provider has an active incident, surface relevant Hacker News and Reddit discussion threads inside the alert card, giving community context and social proof.

## Requirements
- Create a server-side utility `lib/enrichment/community-threads.ts`:
  - HN: hit `hn.algolia.com/api/v1/search?query={provider}+outage&tags=story&numericFilters=created_at_i>{24h_ago}`
  - Reddit: hit `www.reddit.com/search.json?q={provider}+outage&sort=new&t=day&limit=3`
  - Return top 3 results per source: `{ title, url, points/score, commentCount, source: 'hn'|'reddit' }`
  - Cache results in-memory for 5 minutes to avoid rate limits
- Create `CommunityThreads` component:
  - Shown inside AlertCard for active incidents from major providers (AWS, Azure, GCP, Cloudflare, GitHub)
  - Collapsible, similar to IncidentTimeline — "N community threads" toggle
  - Each thread: icon (HN orange Y / Reddit icon), title (truncated), points, comment count, external link
  - Monospace styling, muted colors matching design system
- Trigger the enrichment lookup when an alert is first rendered (client-side fetch), not during polling
- Add a new API route `GET /api/enrichment/threads?provider={key}` that calls the utility

## Acceptance Criteria
- [ ] API route fetches and returns HN + Reddit threads for a provider
- [ ] Results cached in-memory (5 min TTL)
- [ ] CommunityThreads component renders inside AlertCard for qualifying providers
- [ ] Component is collapsible and matches design system
- [ ] External links open in new tab
- [ ] Graceful fallback when no threads found or APIs fail

## Completion Notes
