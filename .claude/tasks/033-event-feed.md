# 033 — Live Event Feed (State Changes)

## Status: queued

## Objective
Add a "What Just Happened" chronological feed showing every state change (new, escalated, de-escalated, resolved) as individual timestamped entries, distinct from the current card view which only shows current state.

## Requirements
- Add a new API endpoint `GET /api/alerts/events` that returns recent state-change events:
  - Track events by capturing SSE bus emissions into a lightweight in-memory ring buffer (last 100 events)
  - Each event: `{ type: 'new'|'updated'|'resolved'|'escalated'|'de-escalated', alertId, source, title, severity, previousSeverity, timestamp }`
  - Also expose via SSE so the feed updates in real-time
- Create an `EventFeed` component:
  - Vertical scrolling list, max height ~300px with overflow
  - Each entry: colored dot (by event type), provider icon, short description, relative timestamp
  - Event descriptions: "AWS — new incident: EC2 degraded", "GitHub — resolved after 2h 14m", "Azure — escalated minor → major"
  - Auto-scrolls to newest entry when new events arrive
  - "No recent activity" empty state
- Add the EventFeed to the dashboard layout — either as a sidebar panel or a collapsible section below the health banner
- Create `useEventFeed` SWR hook + SSE subscription for real-time updates

## Acceptance Criteria
- [ ] Ring buffer captures alert events from the event bus
- [ ] API endpoint returns recent events in chronological order
- [ ] EventFeed component renders with colored dots and provider icons
- [ ] New events appear in real-time via SSE
- [ ] Auto-scroll works on new events
- [ ] Integrates into dashboard layout without disrupting existing components

## Completion Notes
