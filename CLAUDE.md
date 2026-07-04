# IT Alert Dashboard — StatusMonitor

## Project Overview
A centralized IT alert dashboard for monitoring cloud service outages, SaaS incidents, security vulnerabilities, and ISP issues. Public dashboard with authenticated user features (custom views, notifications, blast radius mapping).

## Tech Stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS 4
- **Database**: Prisma ORM + SQLite
- **Auth**: Auth.js (NextAuth v5) — Email (magic link), Google, Microsoft, Apple, GitHub OAuth
- **Real-time**: Server-Sent Events (SSE) with in-memory EventEmitter
- **Notifications**: Resend (email), Slack/Teams webhooks, web-push (browser)
- **Deployment**: Docker on cloud VM, served at `monitor.ducktyped.xyz` (subdomain of Ducktyped)

## Cross-Linking with duckTyped
- **Sibling repo**: `mcvworks/ducktyped` — the parent site this project must stay aligned with. When working on visual or cross-linking changes, clone/add that repo and check its current state; do not rely on this file's snapshot of it.
- **Brand casing**: the parent brand is written `duckTyped` (lowercase d, capital T) in all user-facing text and structured data. This product is `DTMonitor`.
- **Deployment URL**: `https://monitor.ducktyped.xyz`
- **Parent site**: `https://ducktyped.xyz` — free developer/IT tools (55+ browser-based) plus a substantial learning/education section; nav sections: Utility, Learn, Troubleshoot
- **Footer backlink**: "Built by [duckTyped](https://ducktyped.xyz)" in DTMonitor footer (`src/components/layout/Footer.tsx`), also on the sign-in page
- **SEO**: DTMonitor emits `Organization` (duckTyped) + `subOrganization` (DTMonitor WebApplication) JSON-LD in `src/app/layout.tsx`; each site has its own sitemap submitted to Search Console
- **duckTyped → DTMonitor link**: not yet added (task 029, deferred). When added, it goes in duckTyped's `unified-nav-links` list in `frontend/index.html` (and shared nav on tool pages); see `docs/CROSS-LINKING.md` for the markup. Standard `<a>`, no `nofollow`.

## Key Commands
```bash
npm run dev          # Start dev server
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma studio    # Visual DB browser
npm run build        # Production build
npm run lint         # Run ESLint
docker compose up --build  # Build and run in Docker
```

## Architecture

### Access Tiers
- **Public (no account)**: Live dashboard, all services, blast radius view, alert history, search/filtering
- **Authenticated**: Custom dashboard layout, pinned services, saved filters, My Stack (dependency mapping), alert ack/snooze, all notification channels, multiple saved views

### Providers (23 total)
Providers extend `BaseStatuspageProvider`, `BaseRSSProvider`, or `BaseJSONProvider`.

**Cloud (6 original):** AWS, Azure, GCP, Cloudflare, GitHub, Microsoft 365
**Cloud (9 additional):** Slack, Atlassian, Okta, Stripe, Google Workspace, DigitalOcean, Fastly, Vercel, Netlify

> Registry keys in `src/lib/constants.ts` MUST exactly match each provider's `name` field (the `alert.source` written to the DB) — e.g. `m365`, `cisa-kev`, `npm-registry`, `google-workspace`, `dockerhub`, `cloudflare-radar`. A mismatch silently breaks icons, status dots, and filtering for that provider.
**DevOps (4):** Datadog, PagerDuty, Docker Hub, npm Registry
**Security (2):** CISA KEV, NVD
**ISP (1):** Cloudflare Radar
**Meta (1):** Downdetector (crowdsourced)

### Polling
- **Fast tier (2 min)**: Cloud status providers
- **Slow tier (5 min)**: Security feeds, ISP, DevOps tools
- Deduplication by `[source, externalId]`

### Blast Radius / Dependency Graph
Static dependency map + user-configurable "My Stack" mapping. When a major provider (AWS, Cloudflare, etc.) has an incident, shows which downstream services are likely affected.

### Notifications (authenticated only)
- Email (Resend/SMTP), Slack webhook, Teams webhook, Browser push
- Per-channel severity threshold + source whitelist filtering
- Batched per poll cycle

## Project Structure
```
src/
├── app/
│   ├── page.tsx                     # Public dashboard
│   ├── history/page.tsx             # Alert history/timeline
│   ├── auth/                        # Sign-in/sign-up pages
│   ├── dashboard/                   # Authenticated custom dashboard
│   │   ├── page.tsx
│   │   ├── my-stack/page.tsx
│   │   └── settings/page.tsx        # Notification config
│   └── api/
│       ├── auth/[...nextauth]/      # Auth.js route
│       ├── alerts/                   # CRUD + SSE
│       ├── settings/                 # Notification settings
│       ├── push/                     # Push subscription + VAPID
│       └── dependencies/            # Blast radius data
├── lib/
│   ├── db.ts                        # Prisma singleton
│   ├── config.ts                    # Env validation (Zod)
│   ├── auth.ts                      # Auth.js config
│   ├── providers/                   # All data source providers
│   ├── polling/                     # Scheduler, engine, dedup, event bus
│   ├── notifications/               # Dispatcher + channel implementations
│   └── dependencies/                # Blast radius map + resolver
├── components/
│   ├── dashboard/                   # StatusOverview, AlertCard, etc.
│   ├── history/                     # Timeline, HistoryTable
│   ├── settings/                    # NotificationForm, ChannelConfig
│   ├── auth/                        # SignInButton, UserMenu
│   ├── blast-radius/                # BlastRadiusPanel, DependencyGraph
│   └── layout/                      # Header, Sidebar, Footer
└── hooks/                           # useAlerts, useSSE, usePushNotifications
```

## Database Schema (key models)
- **User / Account / Session** — Auth.js standard tables
- **Alert** — `@@unique([source, externalId])`, tracks all incidents
- **UserDashboard** — saved layouts, pinned services, custom views per user
- **UserStack** — user's infrastructure dependency mappings
- **UserNotificationPref** — per-channel, per-source alert config per user
- **UserAlertState** — acknowledged/snoozed/dismissed alerts per user
- **PushSubscription** — browser push endpoints per user
- **NotificationLog** — sent notification audit trail
- **PollLog** — provider polling audit trail
- **DependencyMap** — static provider→service dependency data

## Design System — Lunar-Tech Theme (matches Ducktyped)

This project MUST match the visual style of the duckTyped project (repo `mcvworks/ducktyped`, `frontend/` directory).

**Source of truth**: the token values below are a snapshot. When in doubt — or before any restyle — verify against duckTyped's live token definitions:
- `frontend/utility/styles.css` (`:root` custom properties: colors, fonts, shadows, radii)
- `frontend/index.html` (`:root` vars, `unified-nav` navbar markup/styles, hero patterns)

If duckTyped's tokens have drifted from the values below, duckTyped wins — update this file and the Tailwind theme in `src/app/globals.css` to match.

### Fonts (Google Fonts)
- **Display/Headers:** `'Orbitron'` (weights: 400, 500, 600, 700) — used for brand, section headers, category labels
- **Body/UI:** `'Space Grotesk'` (weights: 400, 500, 600, 700) — main content, buttons, UI text
- **Monospace/Code:** `'Fira Code'`, `'SF Mono'`, `'JetBrains Mono'`, monospace — timestamps, technical labels

### Color Palette

**Brand Colors:**
- Primary (Yellow): `#F2C200` — active states, primary buttons, accents, glow effects
- Primary Hover: `#FFD020`
- Secondary (Teal): `#48E0C7` — success indicators, secondary highlights
- Accent (Orange): `#FA6216` — warnings, trending indicators

**Dark Theme (default):**
- Background: gradient from `#0F1114` to `#0B0D10`
- Card BG: `rgba(21, 26, 34, 0.70)` with `backdrop-filter: blur(12px)`
- Card BG Solid: `#151A22`
- Input BG: `#10141A`
- Hover BG: `#1A2030`
- Text Primary: `#E9EEF5`
- Text Secondary: `#B8C0CC`
- Text Muted: `#8892A0`
- Border: `#232A35`

**Light Theme (`body.light-theme`):**
- Background: gradient from `#F0F2F5` to `#E8EAEF`
- Card BG: `#ffffff`
- Text Primary: `#0F1114`
- Text Secondary: `#555`
- Text Muted: `#777`
- Border: `#D0D5DD`

**Semantic Colors:**
- Success: `#48E0C7` (teal)
- Warning: `#FA6216` (orange)
- Error: `#ff6b6b` (red)
- Info: `#F2C200` (yellow)

**Severity Mapping for Alerts:**
- Critical: `#ff6b6b` (red) with `rgba(255, 107, 107, 0.06)` bg
- Major: `#FA6216` (orange) with `rgba(250, 98, 22, 0.06)` bg
- Minor: `#F2C200` (yellow) with `rgba(242, 194, 0, 0.08)` bg
- Info: `#48E0C7` (teal) with `rgba(72, 224, 199, 0.06)` bg

### Design Patterns
- **Glassmorphism:** Cards use semi-transparent backgrounds with `backdrop-filter: blur(12-18px)`
- **Corner brackets:** Subtle decorative corner lines on cards (14px, 1.5px width, `rgba(242, 194, 0, 0.12)`)
- **Scanline overlay:** Very subtle repeating gradient on cards (opacity 0.02)
- **Background grid:** Fixed tech grid pattern (60px, opacity 0.025)
- **Radial glow:** Subtle radial gradients behind hero/header areas
- **Section dividers:** Left bar (3px wide, 16px tall, yellow) + monospace uppercase label
- **Status dots:** 6px circles with matching glow shadow
- **Buttons:** Primary = yellow bg + dark text; Ghost = transparent + border
- **Inputs:** Dark bg, 1.5px border, yellow focus ring with `0 0 0 3px rgba(242, 194, 0, 0.08)` glow
- **Hover effects:** `-2px` translateY with enhanced shadows
- **Border radius:** 12px (medium), 16px (large), 20px (extra large)

### Tailwind CSS Config
Map these design tokens into the Tailwind config as custom colors, fonts, and utilities. Use CSS custom properties (--primary, --bg-card, etc.) for theme switching.

## Conventions
- Use `async/await` throughout, no raw callbacks
- Zod for all validation (env, API inputs, provider responses)
- All providers implement the `AlertProvider` interface from `lib/providers/types.ts`
- API routes return `NextResponse.json()` with appropriate status codes
- Use SWR for client-side data fetching with SSE for real-time updates
- Keep components in their feature directories, not a flat components folder
- Commit after each task completion with descriptive messages

## Task Management
Tasks are tracked in `.claude/tasks/`. See `_queue.md` for the ordered checklist.
Each task file has requirements, acceptance criteria, and completion notes.