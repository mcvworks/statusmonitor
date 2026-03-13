# 019 — Alert Acknowledgment & Snooze (Auth Required)

## Status: queued

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
- [ ] Acknowledge/snooze/dismiss buttons appear for authenticated users only
- [ ] Actions persist across page reloads (stored in DB)
- [ ] Snoozed alerts reappear after expiry
- [ ] Dismissed alerts reappear when alert status changes
- [ ] "Show dismissed" toggle works
- [ ] Public dashboard unaffected (no action buttons)
- [ ] Commit: "feat: add alert acknowledgment, snooze, and dismiss"

## Completion Notes
_(to be filled after task completion)_
