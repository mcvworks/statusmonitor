# 029 — Add StatusMonitor Link to Ducktyped Toolbar

## Status: queued

## Objective
Add a "Service Status Monitor" link to the Ducktyped site's toolbar/navigation, connecting the two properties with SEO-friendly cross-linking.

## Requirements
- Edit the Ducktyped frontend toolbar/nav section (in `c:\Users\vigdev\ducktyped\frontend`):
  - Add navigation item: "Service Status Monitor" (or shorter: "Status Monitor")
  - Link: `<a href="https://monitor.ducktyped.com">Service Status Monitor</a>`
  - No `rel="nofollow"` — this is a first-party cross-link
  - No `target="_blank"` preferred (keeps users in the ecosystem), or use `rel="noopener"` if opening in new tab
  - Add tooltip/title attribute: "Live cloud & SaaS outage tracking"
  - Style consistently with existing toolbar items
  - Consider an icon (e.g., activity/pulse icon) to distinguish it from other nav items
- Add `Organization` JSON-LD to Ducktyped's `<head>` if not already present:
  - Must match the same org entity used in StatusMonitor
  - Include `sameAs` array with both `ducktyped.com` and `monitor.ducktyped.com`
- Verify the link renders correctly in both dark and light themes
- Test on mobile (toolbar responsive behavior)

## Acceptance Criteria
- [ ] Toolbar link visible on Ducktyped site
- [ ] Link points to `https://monitor.ducktyped.com`
- [ ] No `nofollow` attribute on the link
- [ ] Styled consistently with existing nav items
- [ ] Works in both dark and light theme
- [ ] Responsive on mobile
- [ ] Organization JSON-LD present and matching
- [ ] Commit (in Ducktyped repo): "feat: add Service Status Monitor link to toolbar"

## Completion Notes
_(to be filled after task completion)_
