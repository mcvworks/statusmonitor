# 006 — Provider Interface & Base Classes

## Status: done

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
- [x] `AlertProvider` interface is clean and minimal
- [x] All three base classes handle errors gracefully (return empty array, log error)
- [x] Base classes handle timeouts (10s default)
- [x] Registry can list/filter providers
- [x] No TypeScript errors
- [x] Commit: "feat: add provider interface and base classes"

## Completion Notes
All files created in `src/lib/providers/`:
- `types.ts` — `AlertProvider` interface, `AlertInput` type (matching Prisma Alert model), `ProviderMetadata` type
- `base-statuspage.ts` — `BaseStatuspageProvider` fetches `/api/v2/incidents.json`, maps Statuspage impact → severity, handles component names in descriptions
- `base-rss.ts` — `BaseRSSProvider` uses `rss-parser` with 10s timeout, subclasses implement `mapItem()` for provider-specific mapping
- `base-json.ts` — `BaseJSONProvider<T>` with optional Zod schema validation, subclasses implement `mapResponse()`
- `registry.ts` — `providerRegistry` Map with `registerProvider()`, `getProvidersByCategory()`, `getProvidersByPollTier()` helpers

All base classes return `[]` on error and log to console. All use 10s timeouts (AbortController for fetch-based, parser config for RSS).
