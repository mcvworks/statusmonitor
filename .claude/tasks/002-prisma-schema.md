# 002 — Prisma Schema & Database Setup

## Status: done

## Objective
Define the complete Prisma schema with all models and run the initial migration to create the SQLite database.

## Requirements
- Run `npx prisma init --datasource-provider sqlite`
- Define all models in `prisma/schema.prisma`:
  - **Auth.js models**: User, Account, Session, VerificationToken (per Auth.js Prisma adapter spec)
  - **Alert**: id, externalId, source, category (cloud/security/isp/devops), severity (critical/major/minor/info), title, description, url, region (nullable), timestamp, status (active/resolved/investigating/monitoring), resolvedAt, createdAt, updatedAt — `@@unique([source, externalId])`
  - **UserDashboard**: id, userId, name, layout (JSON), pinnedServices (JSON), filters (JSON), isDefault, createdAt, updatedAt
  - **UserStack**: id, userId, serviceName, provider, region (nullable), notes, createdAt
  - **UserNotificationPref**: id, userId, channel (email/slack/teams/push), enabled, config (JSON — webhook URL, etc.), severityFilter (JSON), sourceFilter (JSON), createdAt, updatedAt
  - **UserAlertState**: id, userId, alertId, state (acknowledged/snoozed/dismissed), snoozedUntil, createdAt, updatedAt — `@@unique([userId, alertId])`
  - **PushSubscription**: id, userId, endpoint, p256dh, auth, createdAt
  - **NotificationLog**: id, userId, channel, alertId, sentAt, success, error
  - **PollLog**: id, provider, startedAt, completedAt, alertsFound, newAlerts, error
  - **DependencyMap**: id, provider, dependentService, confidence (confirmed/likely/possible), region (nullable), source, updatedAt
- Create `src/lib/db.ts` with Prisma singleton pattern (global instance for dev hot reload)
- Run `npx prisma migrate dev --name init` to create the database
- Verify with `npx prisma studio`

## Acceptance Criteria
- [x] All models defined in schema.prisma
- [x] Migration runs cleanly, `dev.db` created
- [x] `db.ts` exports a singleton Prisma client
- [x] `npx prisma studio` opens and shows all tables
- [x] Relations are correct (User → UserDashboard, UserStack, etc.)

## Completion Notes
- Initialized Prisma with SQLite provider via `npx prisma init --datasource-provider sqlite`
- Defined 13 models: User, Account, Session, VerificationToken (Auth.js), Alert, UserDashboard, UserStack, UserNotificationPref, UserAlertState, PushSubscription, NotificationLog, PollLog, DependencyMap
- All relations configured with cascade deletes on user/alert references
- JSON fields stored as String (SQLite limitation)
- Alert has `@@unique([source, externalId])` for dedup; UserAlertState has `@@unique([userId, alertId])`
- Created `src/lib/db.ts` with Prisma singleton pattern for dev hot reload
- Migration `20260313044340_init` applied, `dev.db` created
- Added `*.db` and `*.db-journal` to `.gitignore`
- Installed `dotenv` dependency (required by `prisma.config.ts`)
