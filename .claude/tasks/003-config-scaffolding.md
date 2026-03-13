# 003 — Config Validation & Lib Scaffolding

## Status: queued

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
- [ ] `config.ts` validates env and exports typed config
- [ ] `alert-schema.ts` exports Zod schemas and TypeScript types
- [ ] `utils.ts` has `cn`, `formatRelativeTime`, `truncate`
- [ ] `constants.ts` has all shared constants
- [ ] No TypeScript errors
- [ ] Commit: "feat: add config validation and lib scaffolding"

## Completion Notes
_(to be filled after task completion)_
