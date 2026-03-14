# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    External Sources                      │
│  AWS · Azure · GCP · Cloudflare · GitHub · Slack · ...  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (RSS/JSON/Statuspage API)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Polling Engine                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  │
│  │Scheduler│→ │Providers │→ │ Dedup  │→ │  Upsert  │  │
│  │(cron)   │  │(22 total)│  │Engine  │  │(Prisma)  │  │
│  └─────────┘  └──────────┘  └────────┘  └────┬─────┘  │
└──────────────────────────────────────────────┬──────────┘
                                               │ Events
                                               ▼
┌─────────────────────────────────────────────────────────┐
│                    Event Bus                             │
│         alert:new · alert:updated · alert:resolved       │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
       ▼                                  ▼
┌──────────────┐                ┌─────────────────────┐
│   SSE Route  │                │ Notification System  │
│ /api/alerts/ │                │  ┌──────────────┐   │
│    sse       │                │  │  Dispatcher   │   │
│              │                │  └──────┬───────┘   │
│  Real-time   │                │    ┌────┼────┐      │
│  to browser  │                │    ▼    ▼    ▼      │
└──────┬───────┘                │  Email Slack Push   │
       │                        │       Teams         │
       ▼                        └─────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ Public   │  │  Auth    │  │  Authenticated      │   │
│  │Dashboard │  │ (Auth.js)│  │  Dashboard/Settings │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Data Flow: Providers → Dashboard

1. **Scheduler** (`lib/polling/scheduler.ts`) runs two cron tiers:
   - Fast tier: every 2 minutes — cloud status providers
   - Slow tier: every 5 minutes — DevOps, security, ISP providers
   - Both tiers run immediately on startup

2. **Providers** (`lib/providers/`) fetch data from external sources. Each extends one of three base classes:
   - `BaseStatuspageProvider` — Atlassian Statuspage API (`/api/v2/incidents.json`)
   - `BaseRSSProvider` — RSS/Atom feeds via `rss-parser`
   - `BaseJSONProvider<T>` — arbitrary JSON APIs with optional Zod validation

3. **Dedup Engine** (`lib/polling/dedup.ts`) batch-checks incoming alerts against existing DB rows by `[source, externalId]`. Categorizes as new, updated, or unchanged.

4. **Upsert** (`lib/polling/engine.ts`) writes to database via `prisma.alert.upsert()` on the `@@unique([source, externalId])` constraint. Emits events to the event bus.

5. **Event Bus** (`lib/polling/event-bus.ts`) is a singleton `EventEmitter` (max 200 listeners). Three event types: `alert:new`, `alert:updated`, `alert:resolved`.

6. **SSE Route** (`app/api/alerts/sse/route.ts`) streams events to connected browsers. Heartbeat every 30 seconds. Nginx configured to keep connections alive for 24 hours.

7. **Client** uses `useSSE` hook to merge SSE events into SWR cache for real-time updates without polling.

## Notification Flow

1. `initNotifications()` subscribes to the event bus at scheduler startup
2. Incoming events buffer for 5 seconds (`BATCH_WINDOW_MS`) to batch per poll cycle
3. `dispatchNotifications()` queries all users with enabled notification preferences
4. For each user, alerts are filtered by their `severityFilter` and `sourceFilter`
5. Matching alerts dispatch to configured channels (email, Slack, Teams, push)
6. Each send is logged to `NotificationLog` for audit

## Blast Radius Flow

1. Static dependency map (`lib/dependencies/static-map.ts`) defines known provider → service relationships with confidence levels (confirmed, likely, possible)
2. When viewing blast radius, the resolver enriches static data with live alert status from the database
3. User's "My Stack" entries are overlaid to show personalized impact
4. UI shows affected services grouped by confidence, with active incident indicators

## Database Schema

```
User ──┬── Account (OAuth links)
       ├── Session
       ├── UserDashboard (saved views, pinned services)
       ├── UserStack (personal dependency mapping)
       ├── UserNotificationPref (per-channel config)
       ├── UserAlertState (ack/snooze/dismiss per alert)
       ├── PushSubscription (browser push endpoints)
       └── NotificationLog (sent notification audit)

Alert (@@unique([source, externalId]))
  └── UserAlertState (per-user state overlay)

PollLog (provider polling audit trail)
DependencyMap (static provider→service data, seeded)
VerificationToken (magic link auth)
```

Key constraint: Alerts are deduplicated by `[source, externalId]`, ensuring each external incident maps to exactly one database row regardless of how many times it's polled.

## Auth Flow

1. User clicks sign-in → directed to `/auth/signin`
2. Chooses OAuth provider (Google/Microsoft/Apple/GitHub) or enters email for magic link
3. Auth.js handles OAuth redirect flow or sends magic link via Resend/SMTP
4. On success, creates `User` + `Account` records, establishes database session
5. Session token stored in cookie, validated on each request via `auth()` helper
6. Protected API routes call `auth()` and return 401 if no session

## Key Design Decisions

**SQLite over PostgreSQL:** Chosen for zero-dependency deployment. A single Docker container with a volume-mounted SQLite file is the simplest possible production setup. The read-heavy, low-write workload (polls every 2-5 min, reads on dashboard load) is well-suited to SQLite.

**SSE over WebSockets:** SSE is simpler, works through standard HTTP proxies, auto-reconnects natively, and is sufficient for server→client push. No bidirectional communication is needed.

**Static dependency map:** Provider→service relationships change rarely. A hardcoded map with known confidence levels is more reliable than attempting to discover dependencies dynamically. Easy to update by editing `static-map.ts`.

**Polling over webhooks:** Most status page providers don't offer webhooks. A 2-minute poll interval provides near-real-time data with predictable load and no inbound networking requirements.

**Batched notifications:** A 5-second buffer after each poll cycle prevents notification spam when multiple alerts arrive simultaneously.

**Database sessions:** More secure than JWT for this use case — sessions can be revoked immediately by deleting the DB row, and sensitive data stays server-side.
