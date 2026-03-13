# 011 — Dashboard Page & Alert Components

## Status: queued

## Objective
Build the public dashboard page with alert listing, status overview, and core alert display components.

## Requirements
- Create `src/app/page.tsx` (public dashboard):
  - Server component that fetches current alerts from DB
  - StatusOverview section at top (overall health summary)
  - Alert list grouped by category (Cloud, Security, ISP, DevOps)
  - Shows active incidents prominently, resolved incidents faded
- Create `src/components/dashboard/StatusOverview.tsx`:
  - Grid of provider status cards showing current state
  - Color-coded: green (operational), yellow (degraded), red (outage), gray (unknown)
  - Total active incident count
- Create `src/components/dashboard/AlertCard.tsx`:
  - Displays single alert: severity badge, title, source, timestamp, description preview
  - Links to source URL
  - Expandable for full description
- Create `src/components/dashboard/AlertList.tsx`:
  - Renders list of AlertCards
  - Empty state when no active alerts ("All systems operational")
- Create `src/components/dashboard/CategoryGroup.tsx`:
  - Groups alerts by category with header and count
- Create `src/components/dashboard/SeverityBadge.tsx`:
  - Color-coded badge: critical (red), major (orange), minor (yellow), info (blue)
- Create `src/app/api/alerts/route.ts`:
  - GET: List alerts with query params (category, severity, source, status, limit, offset)
  - Returns paginated JSON response
- Create `src/hooks/useAlerts.ts`:
  - SWR hook for fetching alerts with filters

## Acceptance Criteria
- [ ] Dashboard renders with status overview and alert list
- [ ] Alert cards display all relevant info
- [ ] Alerts grouped by category
- [ ] API route supports filtering and pagination
- [ ] Empty state shows when no alerts
- [ ] Commit: "feat: add public dashboard page with alert components"

## Completion Notes
_(to be filled after task completion)_
