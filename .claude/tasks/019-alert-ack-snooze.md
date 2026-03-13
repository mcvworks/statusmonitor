# 019 — Alert Acknowledgment & Snooze (Auth Required)

## Status: done

## Objective
Allow authenticated users to acknowledge, snooze, or dismiss alerts so they can focus on unhandled incidents.

## Requirements
- Create `src/app/api/alerts/[id]/route.ts`:
  - PATCH: Update user's alert state (acknowledge, snooze, dismiss)
  - Requires authentication
  - Body: `{ state: "acknowledged" | "snoozed" | "dismissed", snoozedUntil?: string }`
  - Creates/updates UserAlertState record
- Update `src/components/dashboard/AlertCard.tsx`:
  - For authenticated users, show action buttons:
    - Acknowledge (check icon) — marks as seen, stays visible but muted
    - Snooze (clock icon) — hide for 30min / 1hr / 4hr / custom
    - Dismiss (x icon) — hide until status changes
  - Visual states: acknowledged (muted opacity), snoozed (hidden), dismissed (hidden)
- Create `src/hooks/useAlertActions.ts`:
  - `acknowledge(alertId)`, `snooze(alertId, until)`, `dismiss(alertId)`
  - Optimistic updates via SWR mutate
- Update alert list rendering:
  - Filter out snoozed/dismissed alerts for authenticated users
  - Show acknowledged alerts with reduced visual weight
  - "Show dismissed" toggle to reveal hidden alerts
  - Badge: "3 alerts dismissed" at bottom of list
- Handle snooze expiry: alerts reappear when snoozedUntil passes

## Acceptance Criteria
- [x] Acknowledge/snooze/dismiss buttons appear for authenticated users only
- [x] Actions persist across page reloads (stored in DB)
- [x] Snoozed alerts reappear after expiry
- [x] Dismissed alerts reappear when alert status changes
- [x] "Show dismissed" toggle works
- [x] Public dashboard unaffected (no action buttons)
- [x] Commit: "feat: add alert acknowledgment, snooze, and dismiss"

## Completion Notes
- Created `src/app/api/alerts/[id]/route.ts` with PATCH (ack/snooze/dismiss) and DELETE (clear state) endpoints, both auth-protected
- Updated `src/app/api/alerts/route.ts` to include user alert states when authenticated (joined via Prisma include)
- Added `SerializedAlertWithState` type and `UserAlertStateValue` enum to `src/lib/alert-schema.ts`
- Created `src/hooks/useAlertActions.ts` with `acknowledge`, `snooze`, `dismiss`, and `clear` functions that revalidate SWR cache
- Updated `AlertCard` with acknowledge (check), snooze (clock with dropdown), dismiss (x), and undo buttons — only visible for authenticated users on active alerts
- Acknowledged alerts show with reduced opacity and "Acknowledged" badge
- Updated `AlertList` to filter out snoozed (unexpired) and dismissed alerts, with a "Show/Hide dismissed" toggle and count badge
- Updated `CategoryGroup` and `useAlerts` to use `SerializedAlertWithState` type
- Snooze expiry handled client-side: alerts reappear when `snoozedUntil` passes current time
