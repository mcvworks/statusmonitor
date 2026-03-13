# 017 — Custom Dashboard & Saved Views (Auth Required)

## Status: queued

## Objective
Allow authenticated users to create custom dashboard views with selected services, custom layouts, and saved filter presets.

## Requirements
- Create `src/app/dashboard/page.tsx`:
  - Authenticated user's personalized dashboard
  - Default view shows all services (same as public) until customized
  - Switch between saved views via tabs/dropdown
- Create `src/app/api/dashboard/route.ts`:
  - GET: Fetch user's saved dashboards
  - POST: Create new dashboard view
  - PUT: Update existing dashboard (layout, pins, filters)
  - DELETE: Remove a saved view
- Create `src/components/dashboard/DashboardCustomizer.tsx`:
  - Service picker: checkbox list of all monitored providers, grouped by category
  - Pin/unpin services to top of dashboard
  - Reorder categories via drag (or simple up/down arrows)
  - Save as named view (e.g., "Production", "Dev Tools", "Security Only")
- Create `src/components/dashboard/SavedViewSwitcher.tsx`:
  - Dropdown or tab bar to switch between saved views
  - "Default" view always available
  - Quick edit/delete for custom views
- Create `src/components/dashboard/PinnedServices.tsx`:
  - Sticky top section showing only pinned provider status cards
  - Always visible above the main alert list
- Server-side: filter alerts based on user's active view config before rendering

## Acceptance Criteria
- [ ] Authenticated users see personalized dashboard at `/dashboard`
- [ ] Users can select which services to show
- [ ] Pin/unpin services works
- [ ] Multiple named views can be saved and switched
- [ ] Default view matches public dashboard
- [ ] Unauthenticated users redirected to sign-in from `/dashboard`
- [ ] Commit: "feat: add custom dashboard with saved views"

## Completion Notes
_(to be filled after task completion)_
