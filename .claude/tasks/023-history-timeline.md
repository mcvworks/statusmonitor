# 023 — Alert History Page & Timeline

## Status: done

## Objective
Build the alert history page with timeline visualization and detailed historical data.

## Requirements
- Create `src/app/history/page.tsx` (public page):
  - Two views: Timeline and Table (toggle between)
  - Date range picker (default: last 7 days)
  - Filters: category, severity, source, status
  - Pagination for large result sets
- Create `src/components/history/Timeline.tsx`:
  - Vertical timeline with alerts as nodes
  - Each node: timestamp, severity badge, title, source, duration (if resolved)
  - Grouped by day
  - Color-coded by severity
  - Show incident duration: start → resolution time
  - Expandable nodes for full description
- Create `src/components/history/HistoryTable.tsx`:
  - Sortable table: timestamp, source, severity, title, status, duration
  - Row click expands to show full details
  - Export to CSV button
- Create `src/app/api/alerts/history/route.ts`:
  - GET: Paginated alert history with date range and filters
  - Query params: startDate, endDate, category, severity, source, status, page, limit, sort, order
  - Returns total count for pagination
- Create `src/hooks/useAlertHistory.ts`:
  - SWR hook with pagination state
  - Handles filter/sort state
- Stats summary at top of page:
  - Total incidents in period
  - Average resolution time
  - Most affected services
  - Incidents by severity breakdown

## Acceptance Criteria
- [x] Timeline view renders chronological incident history
- [x] Table view with sorting and pagination works
- [x] Date range picker filters results
- [x] Category/severity/source filters work
- [x] Stats summary shows meaningful metrics
- [x] CSV export works
- [x] Page is publicly accessible (no auth required)
- [x] Commit: "feat: add alert history page with timeline and table views"

## Completion Notes
All deliverables implemented:
- **API**: `GET /api/alerts/history` with pagination (page/limit), date range (startDate/endDate), filters (category/severity/source/status), sorting (sort/order), and stats computation (total incidents, avg resolution time, severity breakdown, top sources)
- **Hook**: `useAlertHistory` SWR hook managing pagination, filter, and sort state with `keepPreviousData` for smooth UX
- **Timeline**: Vertical timeline grouped by day, color-coded severity dots with glow, expandable nodes showing description/region/duration/external link
- **HistoryTable**: Sortable columns (timestamp/source/severity/status), expandable rows, CSV export button
- **History Page**: Stats summary cards (total incidents, avg resolution, most affected, severity breakdown), date range picker, category/severity/status filters, timeline/table view toggle, pagination controls
- Page is public (no auth required), linked from header navigation
