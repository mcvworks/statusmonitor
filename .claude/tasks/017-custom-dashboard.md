# 017 — Custom Dashboard & Saved Views (Auth Required)

## Status: done

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
- [x] Authenticated users see personalized dashboard at `/dashboard`
- [x] Users can select which services to show
- [x] Pin/unpin services works
- [x] Multiple named views can be saved and switched
- [x] Default view matches public dashboard
- [x] Unauthenticated users redirected to sign-in from `/dashboard`
- [x] Commit: "feat: add custom dashboard with saved views"

## Completion Notes
Implemented custom dashboard with saved views for authenticated users:

- **API route** (`/api/dashboard`): Full CRUD with Zod validation, ownership checks, default view management
- **Dashboard page** (`/dashboard`): Server auth check + redirect, renders CustomDashboard client component
- **SavedViewSwitcher**: Dropdown to switch between Default and named views, with edit/delete
- **DashboardCustomizer**: Service picker by category, pin/unpin, default toggle, named save
- **PinnedServices**: Sticky cards for pinned providers with live status and alert counts
- **useDashboardViews hook**: SWR-based with create/update/delete mutations
- Updated AlertList and StatusOverview with `sourceFilter` prop for view-based filtering
- Build verified. Commit: `51c48a2`
