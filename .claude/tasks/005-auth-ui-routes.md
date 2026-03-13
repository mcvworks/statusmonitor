# 005 — Auth UI & Protected Routes

## Status: queued

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
- [ ] Sign-in page renders with all 6 auth options
- [ ] Error and verify-request pages work
- [ ] SignInButton shows for unauthenticated users
- [ ] UserMenu shows for authenticated users with sign-out
- [ ] AuthGuard redirects unauthenticated users from protected pages
- [ ] Commit: "feat: add auth UI pages and components"

## Completion Notes
_(to be filled after task completion)_
