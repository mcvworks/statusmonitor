# 013 — Remaining Cloud Providers

## Status: done

## Objective
Implement providers for GCP, Okta, Stripe, Google Workspace, DigitalOcean, Fastly, and Vercel/Netlify.

## Requirements
- **Statuspage-based** (extend `BaseStatuspageProvider`):
  - `src/lib/providers/okta.ts` — `https://status.okta.com` — category: `cloud`, tier: `fast`
  - `src/lib/providers/stripe.ts` — `https://status.stripe.com` — category: `cloud`, tier: `fast`
  - `src/lib/providers/digitalocean.ts` — `https://status.digitalocean.com` — category: `cloud`, tier: `fast`
  - `src/lib/providers/fastly.ts` — `https://status.fastly.com` — category: `cloud`, tier: `fast`
  - `src/lib/providers/vercel.ts` — `https://www.vercel-status.com` — category: `cloud`, tier: `fast`
  - `src/lib/providers/netlify.ts` — `https://www.netlifystatus.com` — category: `cloud`, tier: `fast`

- **JSON feed** (extend `BaseJSONProvider`):
  - `src/lib/providers/gcp.ts` — Google Cloud status JSON feed — category: `cloud`, tier: `fast`
  - `src/lib/providers/google-workspace.ts` — Google Workspace status — category: `cloud`, tier: `fast`
  - Note: Google uses a custom JSON format, not Statuspage. Parse their specific schema.

- Register all in provider registry
- Test via debug route

## Acceptance Criteria
- [x] All 8 providers fetch and parse correctly
- [x] Statuspage providers work with zero custom code (just URL + metadata)
- [x] GCP and Google Workspace handle Google's custom JSON format
- [x] All registered in registry
- [x] Commit: "feat: add remaining cloud providers (GCP, Okta, Stripe, DigitalOcean, Fastly, Vercel, Netlify, Google Workspace)"

## Completion Notes
- Created 6 Statuspage providers (Okta, Stripe, DigitalOcean, Fastly, Vercel, Netlify) extending `BaseStatuspageProvider` with zero custom logic
- Created 2 JSON providers (GCP, Google Workspace) extending `BaseJSONProvider` with custom parsing for Google's incident JSON format (severity mapping, status mapping, affected products)
- All 8 providers registered in registry (total: 15 providers)
- Build passes successfully
