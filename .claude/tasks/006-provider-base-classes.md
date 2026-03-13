# 006 — Provider Interface & Base Classes

## Status: queued

## Objective
Define the provider interface and create reusable base classes for the three main data source patterns: Statuspage API, RSS feeds, and JSON feeds.

## Requirements
- Create `src/lib/providers/types.ts`:
  - `AlertProvider` interface: `name: string`, `category: string`, `pollInterval: 'fast' | 'slow'`, `fetchAlerts(): Promise<AlertInput[]>`
  - `AlertInput` type matching the Prisma Alert model fields (minus auto-generated ones)
  - `ProviderMetadata` type for display info (icon, URL, description)
- Create `src/lib/providers/base-statuspage.ts`:
  - `BaseStatuspageProvider` abstract class implementing `AlertProvider`
  - Constructor takes Statuspage base URL (e.g., `https://www.cloudflarestatus.com`)
  - Fetches `/api/v2/incidents.json` and `/api/v2/status.json`
  - Maps Statuspage incident → `AlertInput` (severity mapping: critical/major/minor/none → critical/major/minor/info)
  - Handles pagination, timestamps, component names
- Create `src/lib/providers/base-rss.ts`:
  - `BaseRSSProvider` abstract class implementing `AlertProvider`
  - Uses `rss-parser` to fetch and parse RSS/Atom feeds
  - Abstract method `mapItem(item): AlertInput` for provider-specific mapping
  - Built-in error handling and timeout
- Create `src/lib/providers/base-json.ts`:
  - `BaseJSONProvider` abstract class implementing `AlertProvider`
  - Generic `fetch()` + JSON parse with Zod validation
  - Abstract method `mapResponse(data): AlertInput[]`
- Create `src/lib/providers/registry.ts`:
  - `providerRegistry` map of all registered providers
  - `getProvidersByCategory()`, `getProvidersByPollTier()` helpers

## Acceptance Criteria
- [ ] `AlertProvider` interface is clean and minimal
- [ ] All three base classes handle errors gracefully (return empty array, log error)
- [ ] Base classes handle timeouts (10s default)
- [ ] Registry can list/filter providers
- [ ] No TypeScript errors
- [ ] Commit: "feat: add provider interface and base classes"

## Completion Notes
_(to be filled after task completion)_
