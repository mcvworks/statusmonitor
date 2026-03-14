# 005 — Auth UI & Protected Routes

## Status: done

## Objective
Build the sign-in/sign-up pages and auth-related UI components.

## Requirements
- Create `src/app/auth/signin/page.tsx`:
  - Card layout with app branding
  - OAuth buttons: Google, Microsoft, Apple, GitHub (with provider icons from lucide-react or inline SVGs)
  - Email magic link form (email input + "Send magic link" button)
  - "Why sign up?" section listing benefits (custom dashboard, alerts, My Stack)
- Create `src/app/auth/error/page.tsx` — auth error display
- Create `src/app/auth/verify-request/page.tsx` — "Check your email" page after magic link
- Create `src/components/auth/SignInButton.tsx` — shown in header when not authenticated
- Create `src/components/auth/UserMenu.tsx` — dropdown with user avatar, email, sign out (shown when authenticated)
- Create `src/components/auth/AuthGuard.tsx` — client component wrapper that redirects to sign-in if not authenticated
- Use `auth()` server-side in layouts to pass session to client components
- Style everything with Tailwind, consistent with dashboard look

## Acceptance Criteria
- [x] Sign-in page renders with all 6 auth options
- [x] Error and verify-request pages work
- [x] SignInButton shows for unauthenticated users
- [x] UserMenu shows for authenticated users with sign-out
- [x] AuthGuard redirects unauthenticated users from protected pages
- [x] Commit: "feat: add auth UI pages and components"

## Completion Notes
- Created sign-in page at `src/app/auth/signin/page.tsx` with 4 OAuth buttons (Google, Microsoft, Apple, GitHub) + email magic link form + "Why sign up?" benefits section, all styled with Lunar-Tech dark theme
- Created error page at `src/app/auth/error/page.tsx` with descriptive messages for all Auth.js error types
- Created verify-request page at `src/app/auth/verify-request/page.tsx` for post-magic-link "check your email" flow
- Created `SignInButton` (server component, Link to /auth/signin) and `UserMenu` (client component with avatar, dropdown, sign-out)
- Created `AuthGuard` client component that redirects unauthenticated users with loading spinner
- Created `SessionProvider` wrapper for next-auth/react client-side session access
- Updated root layout: replaced Geist fonts with Orbitron (display), Space Grotesk (body), Fira Code (mono); wrapped app in SessionProvider
- Updated `globals.css` with dark theme defaults
- Updated `auth.ts` to point verifyRequest to `/auth/verify-request` and added error page path
- Updated middleware to include `/auth/verify-request` and `/auth/error` in auth routes
- Build passes successfully (commit a8bc419)
