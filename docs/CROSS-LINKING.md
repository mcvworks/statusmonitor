# Cross-Linking: DTMonitor & duckTyped

> **Sibling repo**: `mcvworks/ducktyped`. Everything in this doc that describes duckTyped
> is a snapshot — verify against that repo's current `frontend/` before acting on it.
>
> **Brand casing**: the parent brand is written `duckTyped` (lowercase d, capital T).
> This product is `DTMonitor`.

## Subdomain Strategy

DTMonitor is deployed as a subdomain of duckTyped:

| Site | URL | Purpose |
|---|---|---|
| duckTyped | `https://ducktyped.xyz` | Parent site — 55+ free browser-based developer/IT tools plus learning content (Utility, Learn, Troubleshoot) |
| DTMonitor | `https://monitor.ducktyped.xyz` | IT alert dashboard |

Both sites are first-party properties under the same domain, which means cross-links pass full link equity and don't need `nofollow` attributes.

## Adding the Nav Link on duckTyped (task 029 — not yet done)

### Where to Add

duckTyped uses a shared "unified nav" (`<nav class="unified-nav">`) with a
`<ul class="unified-nav-links">` list. Current items: **Utility**, **Learn**, **Troubleshoot**.
The nav markup lives in `frontend/index.html` and is repeated/injected on tool pages —
check how the nav is shared in the current codebase and add the link everywhere the
other nav items appear (including the mobile slide-out menu, which reuses the same list).

### Markup

Nav items on duckTyped are single short words, so use a short label in the nav and put
the SEO-descriptive anchor text in duckTyped's footer instead:

```html
<!-- unified-nav-links (all pages) -->
<li><a href="https://monitor.ducktyped.xyz" title="Service Status Monitor — cloud outages and incidents">Status</a></li>

<!-- footer (descriptive anchor text for SEO) -->
<a href="https://monitor.ducktyped.xyz">Service Status Monitor</a>
```

Guidelines:
- Descriptive anchor text ("Service Status Monitor") must appear somewhere on the page — footer is fine if the nav label is just "Status"
- Do **not** add `rel="nofollow"` — these are first-party cross-links
- Style consistently with the existing `unified-nav-links` items (they get `.active` / hover states automatically)

## DTMonitor Footer Backlink

DTMonitor's footer (`src/components/layout/Footer.tsx`) and sign-in page link back to duckTyped:

```html
Built by <a href="https://ducktyped.xyz">duckTyped</a>
```

## SEO Checklist

### Sitemaps
- [ ] duckTyped submits its sitemap (`ducktyped.xyz/sitemap.xml`) to Google Search Console
- [ ] DTMonitor submits its own sitemap (`monitor.ducktyped.xyz/sitemap.xml`) to Google Search Console
- [ ] Both sitemaps contain only their own URLs (no cross-listing)

### Structured Data

Current state (keep these consistent when either changes):

- **duckTyped** (`frontend/index.html`): `SoftwareApplication` JSON-LD with
  `author: { "@type": "Organization", "name": "duckTyped" }`
- **DTMonitor** (`src/app/layout.tsx`): `Organization` ("duckTyped") with a
  `subOrganization` `WebApplication` ("DTMonitor")

Alignment rules:
- The Organization `name` must be `duckTyped` (exact casing) on both sites
- When duckTyped adds the nav link, also add `"https://monitor.ducktyped.xyz"` to its
  Organization/author `sameAs` (and DTMonitor already points at `https://ducktyped.xyz`)

### Canonical URLs
- duckTyped pages: `<link rel="canonical" href="https://ducktyped.xyz/{path}" />`
- DTMonitor pages: `<link rel="canonical" href="https://monitor.ducktyped.xyz/{path}" />`
- Each site's canonical URLs point to itself, never to the other site

### Cross-Links
- No `nofollow` on any links between the two sites (they're first-party)
- duckTyped nav links to DTMonitor; descriptive anchor text appears in duckTyped's footer
- DTMonitor footer links back to duckTyped

### Google Search Console
- Add `monitor.ducktyped.xyz` as a separate property in Google Search Console
- Verify via DNS TXT record or HTML file upload
- Submit `monitor.ducktyped.xyz/sitemap.xml`
- Both properties should show under the same Search Console account

### robots.txt
DTMonitor serves its own `robots.txt` at `monitor.ducktyped.xyz/robots.txt` (see `src/app/robots.ts`):

```
User-agent: *
Allow: /

Sitemap: https://monitor.ducktyped.xyz/sitemap.xml
```

## Design Alignment (moving forward)

DTMonitor must visually track duckTyped. Source of truth for tokens:

- `ducktyped/frontend/utility/styles.css` — `:root` custom properties (colors, fonts, shadows, radii)
- `ducktyped/frontend/index.html` — unified-nav markup/styles, hero patterns

Verified in sync as of 2026-07-04: brand palette (`#F2C200` / `#48E0C7` / `#FA6216`),
surfaces (`#0F1114`, `#151A22`, `#232A35`, glass `rgba(21,26,34,.70)`), text colors,
fonts (Orbitron display / Space Grotesk body), radii (12/16/20px), floating-pill nav.

When restyling either site, re-check this list and update DTMonitor's
`src/app/globals.css` `@theme` block + `CLAUDE.md` snapshot to match duckTyped.
