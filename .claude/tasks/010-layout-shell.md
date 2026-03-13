# 010 — Layout, Header & Sidebar

## Status: done

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
- [x] App shell renders with header, sidebar, content area
- [x] Navigation links work
- [x] Responsive layout (sidebar collapses on mobile)
- [x] Auth state reflected in header (sign in vs user menu)
- [x] Severity/status color system defined
- [x] Footer includes "Built by Ducktyped" backlink
- [x] Organization JSON-LD structured data present
- [x] Fonts match Ducktyped (Orbitron, Space Grotesk, Fira Code)
- [x] Commit: "feat: add app layout shell with header and sidebar"

## Completion Notes
All layout components created and wired into root layout:

- **Header** (`src/components/layout/Header.tsx`): Logo with Orbitron font, Dashboard/History nav links, live indicator dot, last-updated timestamp, auth-aware (SignInButton vs UserMenu), responsive hamburger menu on mobile.
- **Sidebar** (`src/components/layout/Sidebar.tsx`): Collapsible sidebar with category sections (Cloud/DevOps/Security/ISP), provider lists with status dots, auth-only My Stack/Settings links. Hidden on mobile, toggle on desktop.
- **Footer** (`src/components/layout/Footer.tsx`): "Built by Ducktyped" backlink (standard `<a>`, no nofollow, no target), data source attribution.
- **AppShell** (`src/components/layout/AppShell.tsx`): Client component orchestrating Header + Sidebar + main content + Footer with sidebar collapse state.
- **Root layout** (`src/app/layout.tsx`): Updated with AppShell wrapper, Organization JSON-LD structured data, favicon metadata.
- **globals.css**: Full Lunar-Tech design token system — brand/severity/surface/text color tokens in `@theme inline`, glassmorphism card utility, corner bracket decoration, section divider, status dots, tech grid background, light-theme variables, custom scrollbar.
- **Home page** (`src/app/page.tsx`): Replaced Next.js placeholder with hero section and summary cards using design system classes.

Build passes cleanly.
