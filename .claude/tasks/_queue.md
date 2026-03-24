# StatusMonitor — Task Queue

## Phase 1: Project Setup
- [x] [001 — Initialize Next.js Project](001-init-nextjs.md)
- [x] [002 — Prisma Schema & Database Setup](002-prisma-schema.md)
- [x] [003 — Config Validation & Lib Scaffolding](003-config-scaffolding.md)

## Phase 2: Authentication
- [x] [004 — Auth.js Setup with OAuth Providers](004-authjs-setup.md)
- [x] [005 — Auth UI & Protected Routes](005-auth-ui-routes.md)

## Phase 3: Polling Infrastructure
- [x] [006 — Provider Interface & Base Classes](006-provider-base-classes.md)
- [x] [007 — Polling Engine, Dedup & Event Bus](007-polling-engine.md)

## Phase 4: First Providers (Cloud)
- [x] [008 — Statuspage Providers (Cloudflare, GitHub, Atlassian, Slack)](008-statuspage-providers.md)
- [x] [009 — RSS Providers (AWS, Azure, M365)](009-rss-providers.md)

## Phase 5: Public Dashboard UI
- [x] [010 — Layout, Header & Sidebar](010-layout-shell.md)
- [x] [011 — Dashboard Page & Alert Components](011-dashboard-alerts.md)
- [x] [012 — SSE Live Updates & Search/Filter](012-sse-search-filter.md)

## Phase 6: Additional Providers
- [x] [013 — Remaining Cloud Providers (GCP, Okta, Stripe, Google Workspace, DigitalOcean, Fastly, Vercel/Netlify)](013-remaining-cloud-providers.md)
- [x] [014 — DevOps & Security Providers (Datadog, PagerDuty, Docker Hub, npm, CISA KEV, NVD, Cloudflare Radar)](014-devops-security-providers.md)

## Phase 7: Blast Radius / Dependency Graph
- [x] [015 — Static Dependency Map & Data Model](015-dependency-map.md)
- [x] [016 — Blast Radius UI & Dashboard Integration](016-blast-radius-ui.md)

## Phase 8: Authenticated User Features
- [x] [017 — Custom Dashboard & Saved Views](017-custom-dashboard.md)
- [x] [018 — My Stack (User Dependency Mapping)](018-my-stack.md)
- [x] [019 — Alert Acknowledgment & Snooze](019-alert-ack-snooze.md)

## Phase 9: Notifications (Auth-Only)
- [x] [020 — Notification Dispatcher & Email Channel](020-notification-email.md)
- [x] [021 — Slack & Teams Webhook Channels](021-slack-teams-webhooks.md)
- [x] [022 — Browser Push Notifications](022-browser-push.md)

## Phase 10: History & Polish
- [x] [023 — Alert History Page & Timeline](023-history-timeline.md)
- [x] [024 — Dark Mode, Loading States & Responsive Design](024-polish-darkmode.md)

## Phase 11: Docker & Deployment
- [x] [025 — Dockerfile & docker-compose](025-docker-setup.md)
- [x] [026 — Production Config & Healthcheck](026-production-config.md)

## Phase 12: Finalization & Handoff
- [x] [027 — Git Cleanup & Final Push](027-git-final-push.md)
- [x] [028 — Handoff Documentation](028-handoff-docs.md)
- [ ] [029 — Add StatusMonitor Link to Ducktyped Toolbar](029-ducktyped-toolbar-link.md) _(deferred — URL-only access for now)_

## Phase 13: Dashboard Enrichment
- [x] [030 — Aggregate Health Banner](030-health-banner.md)
- [x] [031 — Activity Sparklines per Provider](031-activity-sparklines.md)
- [ ] [032 — Hacker News & Reddit Thread Links](032-hn-reddit-threads.md)
- [ ] [033 — Live Event Feed (State Changes)](033-event-feed.md)
- [x] [034 — Severity Summary Bar](034-severity-summary-bar.md)
- [ ] [035 — Downdetector Crowdsourced Signals](035-downdetector-provider.md)
