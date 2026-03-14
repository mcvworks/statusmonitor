# 007 — Polling Engine, Dedup & Event Bus

## Status: done

## Objective
Build the polling orchestration layer that runs providers on schedule, deduplicates alerts, stores them, and emits events for live updates.

## Requirements
- Create `src/lib/polling/event-bus.ts`:
  - In-memory `EventEmitter` singleton
  - Events: `alert:new`, `alert:updated`, `alert:resolved`
  - Type-safe event payloads
- Create `src/lib/polling/dedup.ts`:
  - `deduplicateAlerts(incoming: AlertInput[]): Promise<{new: AlertInput[], updated: AlertInput[]}>`
  - Check against DB by `[source, externalId]`
  - Detect status changes (e.g., investigating → resolved) as updates
- Create `src/lib/polling/engine.ts`:
  - `pollProvider(provider: AlertProvider): Promise<PollResult>`
  - Fetches alerts → dedup → upsert to DB → emit events → log to PollLog
  - `pollAll(tier: 'fast' | 'slow')` — runs all providers in a tier concurrently with `Promise.allSettled`
  - Error isolation: one provider failure doesn't affect others
- Create `src/lib/polling/scheduler.ts`:
  - Uses `node-cron` to schedule `pollAll('fast')` every 2 minutes and `pollAll('slow')` every 5 minutes
  - `startScheduler()` and `stopScheduler()` functions
  - Runs an initial poll on startup
- Create `src/instrumentation.ts`:
  - Next.js instrumentation hook that calls `startScheduler()` on server boot
  - Only runs on the Node.js runtime (not edge)
- Update `next.config.ts` to enable `instrumentationHook: true` if needed

## Acceptance Criteria
- [x] Event bus emits typed events for new/updated/resolved alerts
- [x] Dedup correctly identifies new vs updated alerts
- [x] Engine polls providers concurrently, isolates failures
- [x] PollLog entries created for each poll cycle
- [x] Scheduler starts on server boot via instrumentation
- [x] Commit: "feat: add polling engine with dedup, event bus, and scheduler"

## Completion Notes
All polling infrastructure implemented:

- **event-bus.ts**: Typed `AlertEventBus` class wrapping Node `EventEmitter` with singleton pattern. Supports `alert:new`, `alert:updated`, `alert:resolved` events with `Alert` model payloads. Max 200 listeners for SSE connections.
- **dedup.ts**: `deduplicateAlerts()` fetches existing alerts by `[source, externalId]` pairs, classifies incoming as `new` (not in DB) or `updated` (status or severity changed). Unchanged alerts are skipped.
- **engine.ts**: `pollProvider()` orchestrates fetch → dedup → upsert → emit → log. `pollAll(tier)` runs all providers in a tier concurrently via `Promise.allSettled` with error isolation. PollLog entries written for each cycle.
- **scheduler.ts**: Provider registry with `registerProvider()`/`registerProviders()`. `startScheduler()` runs initial poll then schedules fast tier (every 2 min) and slow tier (every 5 min) via `node-cron`.
- **instrumentation.ts**: Next.js `register()` hook that dynamically imports and starts the scheduler on Node.js runtime only (not edge).

No config changes needed — Next.js 14+ supports instrumentation natively. Build passes cleanly (pre-existing Prisma edge warnings unrelated to this task).
