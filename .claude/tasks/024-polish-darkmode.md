# 024 — Dark Mode, Loading States & Responsive Design

## Status: done

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
- [x] Dark mode toggles correctly and persists
- [x] All components styled for dark mode
- [x] Skeleton loaders show during data fetching
- [x] Error boundary catches and displays errors
- [x] 404 page works
- [x] App usable on mobile (320px+), tablet, desktop
- [x] No horizontal overflow on any viewport
- [x] Commit: "feat: add dark mode, loading states, and responsive design"

## Completion Notes
- Created `src/hooks/useDarkMode.ts` using `useSyncExternalStore` for FOUC-free theme switching with localStorage persistence and system preference detection
- Updated `globals.css` with CSS custom properties for all theme-dependent colors; light theme fully defined with appropriate surface, text, glass, and grid colors
- Added inline script in `layout.tsx` to prevent flash of wrong theme on page load
- Added sun/moon toggle button in Header (visible on all viewports)
- Created reusable `Skeleton.tsx` (with AlertCard, StatusOverview, Sidebar, HistoryTable variants) and `Spinner.tsx` components
- Created `error.tsx` (error boundary with retry button) and `not-found.tsx` (404 page with back-to-dashboard link)
- Added mobile sidebar overlay with backdrop blur (triggered by hamburger menu, slides in from left on screens < lg)
- Replaced all hardcoded `rgba()` backgrounds with CSS custom properties for proper theme switching
- All touch targets meet 44px minimum on mobile
- Build and lint pass clean
