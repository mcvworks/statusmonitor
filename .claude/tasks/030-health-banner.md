# 030 — Aggregate Health Banner

## Status: done

## Objective
Add a prominent health status banner at the top of the dashboard that gives one-glance situational awareness — green "All clear" or pulsing red with active incident counts.

## Requirements
- Add a `HealthBanner` component above the StatusOverview grid
- Derive aggregate state from active alerts: count by severity, count by provider
- Display states:
  - **All clear**: green teal glow, "All systems operational — 22/22 providers clear"
  - **Degraded**: yellow glow, "N incidents across M providers" with severity breakdown
  - **Critical**: red pulsing glow, "N critical incidents — M providers affected" with provider names
- Clicking the banner when incidents are active should scroll to the alert list
- Responsive: full-width on mobile, centered max-width on desktop
- Use the existing `useAlerts` hook data — no new API endpoints
- Match the lunar-tech glassmorphism style (glass-card, corner brackets optional)

## Acceptance Criteria
- [x] HealthBanner renders at top of public dashboard page
- [x] Shows correct aggregate counts from live alert data
- [x] Visual state changes based on worst active severity
- [x] Critical state has pulse animation
- [x] Click scrolls to alert section
- [x] Matches design system (fonts, colors, glass effects)

## Completion Notes
- Created `HealthBanner` component using `useAlerts` hook data
- Three visual states: clear (teal), degraded (yellow), critical (red pulse)
- Shows severity breakdown and affected provider names
- Click scrolls to `#alert-feed` anchor in DashboardClient
- Added `health-banner-pulse` keyframe animation in globals.css
- Placed above DashboardClient in the public dashboard page
