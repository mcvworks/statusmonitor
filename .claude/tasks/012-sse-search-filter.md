# 012 — SSE Live Updates & Search/Filter

## Status: done

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
- [x] SSE endpoint streams real-time alert events
- [x] useSSE hook connects, reconnects, and merges updates
- [x] LiveIndicator shows connection status
- [x] Search filters alerts by text
- [x] Category/severity/status filters work
- [x] Filters reflect in URL params
- [x] Commit: "feat: add SSE live updates and search/filter UI"

## Completion Notes
- SSE endpoint at `/api/alerts/sse` streams `alert:new`, `alert:updated`, `alert:resolved` events from the event bus with heartbeat keepalive
- `useSSE` hook auto-connects with exponential backoff reconnection (up to 10 retries), invalidates SWR cache on events
- `LiveIndicator` shows connected/connecting/disconnected status with colored dot + label
- `SearchFilter` with debounced text search (300ms), category/severity/status dropdowns, active filter chips, URL query param sync
- `AlertList` updated to accept filter props and perform client-side text search for instant results
- `DashboardClient` wrapper ties SSE + search/filter + StatusOverview + AlertList together
- Dashboard page (`page.tsx`) updated to use DashboardClient for all interactive parts
