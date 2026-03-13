# 011 — Dashboard Page & Alert Components

## Status: done

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
- [x] Dashboard renders with status overview and alert list
- [x] Alert cards display all relevant info
- [x] Alerts grouped by category
- [x] API route supports filtering and pagination
- [x] Empty state shows when no alerts
- [x] Commit: "feat: add public dashboard page with alert components"

## Completion Notes
All components implemented:
- **API route** (`src/app/api/alerts/route.ts`): GET with category/severity/source/status filtering, pagination (limit/offset), sorted by status then timestamp
- **useAlerts hook** (`src/hooks/useAlerts.ts`): SWR-based with 30s auto-refresh, filter support
- **SeverityBadge**: Color-coded with dot indicator using SEVERITY_COLORS constants
- **AlertCard**: Expandable card with severity badge, provider name, region, relative timestamp, external link, resolved state (faded)
- **CategoryGroup**: Groups alerts by category with section-label header and count
- **AlertList**: Client component using useAlerts hook, groups by category (cloud→devops→security→isp), loading/error/empty states
- **StatusOverview**: Provider status grid derived from active alerts — operational/degraded/outage with status dots
- **page.tsx**: Server component with async stats (active incidents, security advisories, last poll time) + client StatusOverview and AlertList
