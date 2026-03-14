# Cross-Linking: StatusMonitor & Ducktyped

## Subdomain Strategy

StatusMonitor is deployed as a subdomain of Ducktyped:

| Site | URL | Purpose |
|---|---|---|
| Ducktyped | `https://ducktyped.com` | Parent site — learning platform |
| StatusMonitor | `https://monitor.ducktyped.com` | IT alert dashboard |

Both sites are first-party properties under the same domain, which means cross-links pass full link equity and don't need `nofollow` attributes.

## Adding the Toolbar Link on Ducktyped

### Where to Add

In Ducktyped's navigation/toolbar component, add a link to StatusMonitor alongside other navigation items.

### Markup

```html
<a href="https://monitor.ducktyped.com" title="Monitor cloud service outages and incidents">
  Service Status Monitor
</a>
```

Guidelines:
- Use descriptive anchor text: "Service Status Monitor" (not "click here" or a bare URL)
- Do **not** add `rel="nofollow"` — these are first-party cross-links
- Optional: add a `title` attribute for accessibility
- Style consistently with the existing toolbar/nav items

## StatusMonitor Footer Backlink

StatusMonitor's footer includes a backlink to Ducktyped:

```
Built by Ducktyped
```

This is implemented in the footer component with:
```html
<a href="https://ducktyped.com">Ducktyped</a>
```

## SEO Checklist

### Sitemaps
- [ ] Ducktyped submits its sitemap (`ducktyped.com/sitemap.xml`) to Google Search Console
- [ ] StatusMonitor submits its own sitemap (`monitor.ducktyped.com/sitemap.xml`) to Google Search Console
- [ ] Both sitemaps contain only their own URLs (no cross-listing)

### Structured Data
Both sites should include matching `Organization` JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ducktyped",
  "url": "https://ducktyped.com",
  "sameAs": [
    "https://monitor.ducktyped.com"
  ]
}
```

StatusMonitor can additionally include a `WebApplication` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "StatusMonitor",
  "url": "https://monitor.ducktyped.com",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web",
  "author": {
    "@type": "Organization",
    "name": "Ducktyped",
    "url": "https://ducktyped.com"
  }
}
```

### Canonical URLs
- Ducktyped pages: `<link rel="canonical" href="https://ducktyped.com/{path}" />`
- StatusMonitor pages: `<link rel="canonical" href="https://monitor.ducktyped.com/{path}" />`
- Each site's canonical URLs point to itself, never to the other site

### Cross-Links
- No `nofollow` on any links between the two sites (they're first-party)
- Ducktyped toolbar links to StatusMonitor with descriptive anchor text
- StatusMonitor footer links back to Ducktyped

### Google Search Console
- Add `monitor.ducktyped.com` as a separate property in Google Search Console
- Verify via DNS TXT record or HTML file upload
- Submit `monitor.ducktyped.com/sitemap.xml`
- Both properties should show under the same Search Console account

### robots.txt
StatusMonitor should have its own `robots.txt` at `monitor.ducktyped.com/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://monitor.ducktyped.com/sitemap.xml
```
