# 012 — SSE Live Updates & Search/Filter

## Status: queued

## Objective
Add real-time updates via Server-Sent Events and search/filter functionality to the dashboard.

## Requirements
- Create `src/app/api/alerts/sse/route.ts`:
  - SSE endpoint using `ReadableStream`
  - Subscribes to event bus (`alert:new`, `alert:updated`, `alert:resolved`)
  - Sends JSON-encoded alert events to connected clients
  - Handles client disconnect (cleanup listener)
  - Set appropriate headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Create `src/hooks/useSSE.ts`:
  - Custom hook that connects to SSE endpoint
  - Auto-reconnect on disconnect with exponential backoff
  - Merges SSE events into SWR cache (via `mutate`)
  - Returns connection status (connected/connecting/disconnected)
- Create `src/components/dashboard/LiveIndicator.tsx`:
  - Pulsing green dot when connected, gray when disconnected
  - Tooltip showing connection status
- Create `src/components/dashboard/SearchFilter.tsx`:
  - Search input (searches title + description)
  - Filter dropdowns: category, severity, status, source/provider
  - Active filter chips with clear button
  - Debounced search (300ms)
  - Updates URL query params for shareable filtered views
- Integrate SSE + search/filter into the dashboard page
- Ensure filters work both client-side (for speed) and via API (for pagination)

## Acceptance Criteria
- [ ] SSE endpoint streams real-time alert events
- [ ] useSSE hook connects, reconnects, and merges updates
- [ ] LiveIndicator shows connection status
- [ ] Search filters alerts by text
- [ ] Category/severity/status filters work
- [ ] Filters reflect in URL params
- [ ] Commit: "feat: add SSE live updates and search/filter UI"

## Completion Notes
_(to be filled after task completion)_
