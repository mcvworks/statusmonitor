# 013 — Remaining Cloud Providers

## Status: queued

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
- [ ] All 8 providers fetch and parse correctly
- [ ] Statuspage providers work with zero custom code (just URL + metadata)
- [ ] GCP and Google Workspace handle Google's custom JSON format
- [ ] All registered in registry
- [ ] Commit: "feat: add remaining cloud providers (GCP, Okta, Stripe, DigitalOcean, Fastly, Vercel, Netlify, Google Workspace)"

## Completion Notes
_(to be filled after task completion)_
