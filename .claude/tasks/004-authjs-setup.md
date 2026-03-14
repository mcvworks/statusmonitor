# 004 — Auth.js Setup with OAuth Providers

## Status: done

## Objective
Configure Auth.js (NextAuth v5) with Prisma adapter and all 5 OAuth providers plus magic link email.

## Requirements
- Create `src/lib/auth.ts` with Auth.js config:
  - Prisma adapter pointing to the existing db singleton
  - Providers:
    - **Google** OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    - **Microsoft/Azure AD** OAuth (MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET)
    - **Apple** OAuth (APPLE_ID, APPLE_SECRET)
    - **GitHub** OAuth (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
    - **Email** magic link via Resend (RESEND_API_KEY, EMAIL_FROM)
  - Database session strategy (not JWT) since we have Prisma
  - Callbacks: include user ID in session
- Create `src/app/api/auth/[...nextauth]/route.ts` — Auth.js catch-all route
- Add `auth()` middleware helper for checking session in API routes
- Update `src/middleware.ts` for route protection:
  - Public routes: `/`, `/history`, `/api/alerts`, `/api/alerts/sse`, `/api/dependencies`
  - Protected routes: `/dashboard/**`, `/api/settings/**`, `/api/push/**`
  - Auth routes: `/auth/**` (accessible only when NOT signed in)
- Update `.env.example` with all OAuth placeholder vars

## Acceptance Criteria
- [x] Auth.js config exports `auth`, `signIn`, `signOut`, `handlers`
- [x] API route handles all auth endpoints
- [x] Middleware correctly protects/exposes routes
- [x] `.env.example` updated with all auth env vars
- [x] No TypeScript errors
- [x] Commit: "feat: configure Auth.js with 5 OAuth providers + email"

## Completion Notes
- Created `src/lib/auth.ts` with NextAuth v5 config using PrismaAdapter, database session strategy, 4 OAuth providers (Google, Microsoft Entra ID, Apple, GitHub) + Resend email magic link
- Created `src/app/api/auth/[...nextauth]/route.ts` catch-all route
- Created `src/middleware.ts` with public/auth/protected route logic
- Updated `src/lib/config.ts` env vars to use Auth.js v5 naming conventions (AUTH_SECRET, AUTH_GOOGLE_ID, etc.)
- Fixed Prisma v7 compatibility: updated `db.ts` to use `@prisma/adapter-better-sqlite3` driver adapter and correct import path
- Installed `@prisma/adapter-better-sqlite3`, `better-sqlite3`, `@types/better-sqlite3`
- Zero TypeScript errors
