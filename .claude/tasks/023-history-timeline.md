# 023 — Alert History Page & Timeline

## Status: queued

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
- [ ] Timeline view renders chronological incident history
- [ ] Table view with sorting and pagination works
- [ ] Date range picker filters results
- [ ] Category/severity/source filters work
- [ ] Stats summary shows meaningful metrics
- [ ] CSV export works
- [ ] Page is publicly accessible (no auth required)
- [ ] Commit: "feat: add alert history page with timeline and table views"

## Completion Notes
_(to be filled after task completion)_
