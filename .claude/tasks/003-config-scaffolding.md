# 003 — Config Validation & Lib Scaffolding

## Status: done

## Objective
Set up environment variable validation with Zod, create the alert schema types, and scaffold shared utility files.

## Requirements
- Create `src/lib/config.ts`:
  - Zod schema validating all env vars (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, OAuth client IDs/secrets, RESEND_API_KEY, VAPID keys, CLOUDFLARE_RADAR_API_KEY, NVD_API_KEY)
  - Export typed `env` object, throw on invalid config at startup
  - Group optional vs required vars clearly
- Create `src/lib/alert-schema.ts`:
  - Zod schemas for alert severity, category, status enums
  - `AlertInput` type used by all providers
  - Serialized alert type for API responses
- Create `src/lib/utils.ts`:
  - `cn()` helper using `clsx` + `tailwind-merge`
  - `formatRelativeTime()` for "2 minutes ago" display
  - `truncate()` for long text
- Create `src/lib/constants.ts`:
  - Provider names, categories, severity levels
  - Polling intervals (FAST_POLL_MS, SLOW_POLL_MS)
  - Max alert age for cleanup

## Acceptance Criteria
- [x] `config.ts` validates env and exports typed config
- [x] `alert-schema.ts` exports Zod schemas and TypeScript types
- [x] `utils.ts` has `cn`, `formatRelativeTime`, `truncate`
- [x] `constants.ts` has all shared constants
- [x] No TypeScript errors
- [x] Commit: "feat: add config validation and lib scaffolding"

## Completion Notes
All four files created and committed:

- **config.ts** — Zod schema validates required vars (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL) and optional vars (OAuth, Resend, VAPID, provider API keys). Exports typed `env` object, throws on invalid config.
- **alert-schema.ts** — Zod enums for severity/category/status, `AlertInputSchema` for provider output, `SerializedAlertSchema` for API responses, with matching TypeScript types.
- **utils.ts** — `cn()` (clsx + tailwind-merge), `formatRelativeTime()` using Intl.RelativeTimeFormat, `truncate()` with ellipsis.
- **constants.ts** — Polling intervals (2min/5min), severity order + colors, category labels, full provider registry (22 providers) with name/category/tier metadata.

No TypeScript errors in new files. Commit: `920f8d6`.
