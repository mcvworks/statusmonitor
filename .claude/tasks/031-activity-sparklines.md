# 031 — Activity Sparklines per Provider

## Status: done

## Objective
Add tiny inline sparkline charts to the StatusOverview provider grid showing incident frequency over the last 7 days, giving a temporal dimension the dashboard currently lacks.

## Requirements
- Add a new API endpoint `GET /api/alerts/activity` that returns per-provider daily incident counts for the last 7 days
  - Query: group alerts by `source` and day of `timestamp`, count per bucket
  - Response: `Record<string, number[]>` (provider key → array of 7 daily counts)
- Create a `Sparkline` component (pure SVG, no chart library)
  - Accepts `data: number[]`, renders a small polyline (e.g., 48×16px)
  - Line color: provider's brand color (use `ensureReadable`)
  - Fill: subtle gradient below the line (10% opacity)
  - Zero line when all counts are 0 (flat gray line)
- Integrate into `StatusOverview` grid — sparkline appears below/beside each provider name
- Add a `useActivity` SWR hook for the new endpoint (refresh every 5 min)

## Acceptance Criteria
- [x] API endpoint returns 7-day daily counts per provider
- [x] Sparkline SVG component renders correctly with varying data
- [x] Each provider in the status grid shows its sparkline
- [x] Sparklines use provider brand colors
- [x] Empty/zero data shows a flat muted line
- [x] No external chart library added

## Completion Notes
- API route: `src/app/api/alerts/activity/route.ts` — queries alerts from last 7 days, groups by source and day, returns `Record<string, number[]>`
- Sparkline component: `src/components/dashboard/Sparkline.tsx` — pure SVG polyline with gradient fill, uses `ensureReadable` for brand colors, flat muted line for zero data
- SWR hook: `src/hooks/useActivity.ts` — fetches activity data with 5-minute refresh
- Integrated into `StatusOverview.tsx` — sparkline appears inline beside each provider name in the grid
