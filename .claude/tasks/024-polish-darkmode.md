# 024 — Dark Mode, Loading States & Responsive Design

## Status: queued

## Objective
Add dark mode support, loading/error states, and ensure the app is fully responsive.

## Requirements
- **Dark mode**:
  - Toggle in header (sun/moon icon)
  - Persist preference in localStorage (and in user profile for authenticated users)
  - Use Tailwind `dark:` variant with `class` strategy
  - Respect system preference as default (`prefers-color-scheme`)
  - Create `src/hooks/useDarkMode.ts`
  - Ensure all components have dark mode styles
  - Test: all text readable, sufficient contrast, no unstyled elements

- **Loading states**:
  - Skeleton loaders for: alert cards, status overview, sidebar, history table
  - Create `src/components/ui/Skeleton.tsx` — reusable skeleton component
  - `src/components/ui/Spinner.tsx` — inline loading spinner
  - Loading states for: initial page load, filter changes, pagination
  - SSE reconnection indicator

- **Error states**:
  - Create `src/app/error.tsx` — Next.js error boundary
  - Create `src/app/not-found.tsx` — 404 page
  - Inline error states for: failed API calls, provider errors
  - "Retry" button on failed loads
  - Toast notifications for transient errors (e.g., "Failed to acknowledge alert")

- **Responsive design**:
  - Mobile: sidebar collapsed by default, hamburger toggle
  - Tablet: sidebar visible but compact
  - Desktop: full sidebar
  - Alert cards stack vertically on mobile
  - History table horizontal scroll on small screens
  - Touch-friendly tap targets (min 44px)

## Acceptance Criteria
- [ ] Dark mode toggles correctly and persists
- [ ] All components styled for dark mode
- [ ] Skeleton loaders show during data fetching
- [ ] Error boundary catches and displays errors
- [ ] 404 page works
- [ ] App usable on mobile (320px+), tablet, desktop
- [ ] No horizontal overflow on any viewport
- [ ] Commit: "feat: add dark mode, loading states, and responsive design"

## Completion Notes
_(to be filled after task completion)_
