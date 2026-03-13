# 016 — Blast Radius UI & Dashboard Integration

## Status: queued

## Objective
Build the blast radius UI that shows which downstream services are potentially affected when a major provider has an incident.

## Requirements
- Create `src/components/blast-radius/BlastRadiusPanel.tsx`:
  - Expandable panel shown on major provider alert cards
  - Badge: "⚡ N services potentially affected"
  - Expanded view: list of affected services grouped by confidence (confirmed, likely, possible)
  - "Confirmed" = dependent service also has an active alert
  - "Likely" = high confidence mapping, no active alert yet
  - "Possible" = lower confidence mapping
  - Color coding: red (confirmed), orange (likely), gray (possible)
- Create `src/components/blast-radius/DependencyList.tsx`:
  - Renders list of dependent services with icons and status
  - Links to service status pages where available
- Create `src/components/blast-radius/BlastRadiusSummary.tsx`:
  - Small summary widget for the StatusOverview section
  - Shows: "3 major providers with active incidents affecting ~25 services"
- Integrate into dashboard:
  - AlertCard shows blast radius badge for major providers (AWS, Azure, GCP, Cloudflare, Fastly)
  - StatusOverview includes BlastRadiusSummary when relevant
- Fetch dependency data via SWR hook `src/hooks/useDependencies.ts`
- Cross-reference active alerts with dependency map to determine confirmed vs likely

## Acceptance Criteria
- [ ] Blast radius badge appears on major provider alerts
- [ ] Expanding shows categorized affected services
- [ ] Confirmed affected services (with their own alerts) highlighted
- [ ] Summary widget in status overview
- [ ] Graceful when no dependencies exist for a provider
- [ ] Commit: "feat: add blast radius UI with dependency visualization"

## Completion Notes
_(to be filled after task completion)_
