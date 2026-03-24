# 034 — Severity Summary Bar

## Status: done

## Objective
Add a horizontal stacked bar visualization showing the distribution of active incidents by severity, providing an at-a-glance ratio view.

## Requirements
- Create a `SeveritySummaryBar` component:
  - Horizontal stacked bar using divs (no chart library)
  - Segments: critical (red), major (orange), minor (yellow), info (teal)
  - Each segment width proportional to count; minimum width so tiny segments are visible
  - Hover/click a segment to filter the alert list by that severity
  - Labels above/below: count per severity level
  - Smooth width transitions when counts change (CSS transition)
  - Empty state: thin muted line with "No active incidents" label
- Place between the HealthBanner (task 030) and StatusOverview, or integrate into the HealthBanner
- Use existing `useAlerts` data — filter to active (non-resolved) alerts and count by severity
- Match design system: monospace labels, severity colors from constants, glass-card container

## Acceptance Criteria
- [x] Stacked bar renders with correct proportions
- [x] Colors match SEVERITY_COLORS from constants
- [x] Segment click filters alert list by severity (via URL search params)
- [x] Smooth transitions on data changes
- [x] Responsive — works on mobile widths
- [x] Empty state when no active incidents

## Completion Notes
- Component: `src/components/dashboard/SeveritySummaryBar.tsx` — client component using `useAlerts` to count active incidents by severity
- Stacked bar uses proportional widths with 4% minimum segment size so tiny counts remain visible
- Labels above the bar show dot + count per severity; clicking a label or segment toggles URL `severity` param for filtering
- Active filter dims non-matching segments (opacity 40%); `transition-all duration-500` for smooth width changes
- Empty state: muted line + "No active incidents" label
- Placed in `page.tsx` between HealthBanner and DashboardClient, wrapped in Suspense for `useSearchParams`
