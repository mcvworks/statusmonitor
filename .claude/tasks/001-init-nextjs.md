# 001 — Initialize Next.js Project

## Status: queued

## Objective
Scaffold the Next.js 14+ project with TypeScript, Tailwind CSS 4, ESLint, and all base dependencies.

## Requirements
- Run `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS, ESLint, `src/` directory
- Install core dependencies:
  - `prisma @prisma/client` (database)
  - `next-auth@beta @auth/prisma-adapter` (auth)
  - `node-cron @types/node-cron` (scheduling)
  - `rss-parser` (RSS feeds)
  - `web-push @types/web-push` (browser push)
  - `resend` (email)
  - `zod` (validation)
  - `swr` (client data fetching)
  - `lucide-react` (icons)
  - `clsx tailwind-merge` (classname utils)
- Create the base directory structure under `src/`:
  - `lib/`, `lib/providers/`, `lib/polling/`, `lib/notifications/`, `lib/dependencies/`
  - `components/dashboard/`, `components/history/`, `components/settings/`, `components/auth/`, `components/blast-radius/`, `components/layout/`
  - `hooks/`
  - `app/api/`, `app/auth/`, `app/history/`, `app/dashboard/`
- Add a `.gitkeep` in empty directories
- Create `.env.example` with placeholder vars
- Verify `npm run dev` starts without errors

## Acceptance Criteria
- [ ] Next.js app runs on `localhost:3000`
- [ ] All dependencies installed without errors
- [ ] Directory structure matches CLAUDE.md spec
- [ ] `.env.example` exists with all expected env vars
- [ ] TypeScript compiles cleanly
- [ ] Git repo initialized with initial commit

## Completion Notes
_(to be filled after task completion)_