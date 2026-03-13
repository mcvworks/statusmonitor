# 010 — Layout, Header & Sidebar

## Status: queued

## Objective
Build the app shell with header, sidebar navigation, and root layout that works for both public and authenticated views.

## Requirements
- Create `src/components/layout/Header.tsx`:
  - App logo/name ("StatusMonitor")
  - Navigation links: Dashboard, History
  - Live indicator dot (green when SSE connected)
  - Last updated timestamp
  - Auth section: SignInButton (unauthenticated) or UserMenu (authenticated)
  - Responsive: hamburger menu on mobile
- Create `src/components/layout/Sidebar.tsx`:
  - Category sections: Cloud, DevOps, Security, ISP
  - Service list with status indicators (colored dots)
  - Collapsible on mobile
  - For authenticated users: link to My Stack, Settings
- Create `src/components/layout/Footer.tsx`:
  - "Built by [Ducktyped](https://ducktyped.com)" backlink (standard `<a>`, no `nofollow`, no `target="_blank"`)
  - Data source attribution and last poll time
- Update `src/app/layout.tsx`:
  - Root layout with Header, Sidebar, main content area
  - Pass auth session via server component
  - Include metadata (title, description, favicon)
  - Set up fonts: Orbitron (display), Space Grotesk (body), Fira Code (mono) via Google Fonts — per CLAUDE.md design system
  - Add `Organization` JSON-LD structured data matching Ducktyped's entity
- Set up Tailwind CSS base styles:
  - Color palette for severity levels (red/critical, orange/major, yellow/minor, blue/info)
  - Status colors (green/operational, red/outage, yellow/degraded)
  - Dark mode CSS variables (implement toggle in Phase 10)

## Acceptance Criteria
- [ ] App shell renders with header, sidebar, content area
- [ ] Navigation links work
- [ ] Responsive layout (sidebar collapses on mobile)
- [ ] Auth state reflected in header (sign in vs user menu)
- [ ] Severity/status color system defined
- [ ] Footer includes "Built by Ducktyped" backlink
- [ ] Organization JSON-LD structured data present
- [ ] Fonts match Ducktyped (Orbitron, Space Grotesk, Fira Code)
- [ ] Commit: "feat: add app layout shell with header and sidebar"

## Completion Notes
_(to be filled after task completion)_
