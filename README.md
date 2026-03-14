# StatusMonitor

A centralized IT alert dashboard for monitoring cloud service outages, SaaS incidents, security vulnerabilities, and ISP issues. Deployed at [monitor.ducktyped.com](https://monitor.ducktyped.com).

## Features

### Public (no account required)
- Live dashboard with real-time updates via Server-Sent Events
- 22 monitored providers across cloud, DevOps, security, and ISP categories
- Blast radius visualization — see which downstream services are affected by provider incidents
- Alert history with timeline and table views
- Search, filter by category/severity/source/status

### Authenticated users
- Custom dashboard layouts with pinned services and saved views
- My Stack — map your infrastructure dependencies for personalized blast radius
- Alert acknowledgment, snooze, and dismiss
- Multi-channel notifications: email, Slack, Teams, browser push
- Per-channel severity and source filtering

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env — at minimum set AUTH_SECRET

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Seed the dependency map
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Database | Prisma ORM + SQLite |
| Auth | Auth.js v5 (Google, Microsoft, Apple, GitHub, magic link) |
| Real-time | Server-Sent Events (SSE) |
| Notifications | Resend/SMTP, Slack/Teams webhooks, web-push |
| Deployment | Docker on cloud VM |

## Monitored Providers (22)

**Cloud:** AWS, Azure, GCP, Cloudflare, GitHub, Slack, Atlassian, Okta, Stripe, Google Workspace, DigitalOcean, Fastly, Vercel, Netlify

**DevOps:** Datadog, PagerDuty, Docker Hub, npm Registry

**Security:** CISA KEV, NVD

**ISP:** Cloudflare Radar

**Meta:** Downdetector

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — production setup, OAuth, Docker, nginx
- [Architecture](docs/ARCHITECTURE.md) — system design, data flows, key decisions
- [Adding Providers](docs/ADDING-PROVIDERS.md) — extend with new status sources
- [API Reference](docs/API.md) — all endpoints with examples
- [Cross-Linking](docs/CROSS-LINKING.md) — Ducktyped integration and SEO

## Docker

```bash
docker compose up --build
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full production setup.

---

Built by [Ducktyped](https://ducktyped.com)
