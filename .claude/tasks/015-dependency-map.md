# 015 — Static Dependency Map & Data Model

## Status: queued

## Objective
Create the static infrastructure dependency map that powers the blast radius feature, showing which services run on which major providers.

## Requirements
- Create `src/lib/dependencies/static-map.ts`:
  - Data structure mapping major providers to dependent services:
    - **AWS**: Slack, Netflix, Twilio, Stripe, Reddit, Vercel, Notion, Datadog, PagerDuty, Auth0, Airtable, Figma, Adobe, Capital One, Lyft, DoorDash, Robinhood
    - **Cloudflare**: Discord, Canva, Shopify, Medium, Udemy, DoorDash, Stack Overflow, Notion (partial)
    - **GCP**: Spotify, Snapchat, Twitter/X, PayPal, Target, Home Depot, Etsy, Shopify (partial)
    - **Azure**: Microsoft 365, Teams, LinkedIn, OpenAI/ChatGPT, SAP, Adobe (partial), eBay, FedEx, Walmart
    - **Fastly**: GitHub, Stripe (partial), Twitch, Pinterest, NYTimes, The Guardian, Reddit (partial)
  - Each entry includes: service name, confidence level (confirmed/likely/possible), regions (if known), source URL
- Create `src/lib/dependencies/resolver.ts`:
  - `getAffectedServices(provider: string, region?: string): DependentService[]`
  - `getProviderForService(service: string): string[]`
  - Cross-reference: if both a provider AND its dependent have active alerts, mark as "confirmed affected"
- Seed the `DependencyMap` table with static data via a Prisma seed script (`prisma/seed.ts`)
- Create `src/app/api/dependencies/route.ts`:
  - GET: Returns dependency map, optionally filtered by provider
  - GET with `?provider=aws&active=true`: Returns affected services with current alert status
- Add seed script to `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`

## Acceptance Criteria
- [ ] Static dependency map covers all 5 major providers with 50+ services
- [ ] Resolver returns affected services for a given provider
- [ ] Seed script populates DependencyMap table
- [ ] API route returns dependency data
- [ ] Confidence levels assigned to each mapping
- [ ] Commit: "feat: add static dependency map and resolver"

## Completion Notes
_(to be filled after task completion)_
