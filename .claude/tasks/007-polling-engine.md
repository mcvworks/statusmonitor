# 007 — Polling Engine, Dedup & Event Bus

## Status: queued

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
- [ ] Event bus emits typed events for new/updated/resolved alerts
- [ ] Dedup correctly identifies new vs updated alerts
- [ ] Engine polls providers concurrently, isolates failures
- [ ] PollLog entries created for each poll cycle
- [ ] Scheduler starts on server boot via instrumentation
- [ ] Commit: "feat: add polling engine with dedup, event bus, and scheduler"

## Completion Notes
_(to be filled after task completion)_
