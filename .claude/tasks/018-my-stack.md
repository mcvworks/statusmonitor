# 018 — My Stack (User Dependency Mapping) (Auth Required)

## Status: queued

## Objective
Allow authenticated users to define their own infrastructure stack so blast radius analysis is personalized to their services.

## Requirements
- Create `src/app/dashboard/my-stack/page.tsx`:
  - Page where users define what infrastructure they use
  - Two sections: "Services I Use" and "My Blast Radius"
- Create `src/app/api/stack/route.ts`:
  - GET: Fetch user's stack entries
  - POST: Add service to stack
  - DELETE: Remove service from stack
- Create `src/components/dashboard/MyStackEditor.tsx`:
  - Add service form: service name (autocomplete from known services), provider (dropdown), region (optional), notes
  - Pre-populated suggestions: "Common stacks" quick-add (e.g., "Startup on AWS" = Vercel + Stripe + Slack + GitHub + Datadog)
  - List of added services with edit/remove
  - Visual: group by provider to show concentration risk
- Create `src/components/blast-radius/PersonalBlastRadius.tsx`:
  - Shows user's stack overlaid on active incidents
  - When AWS is down: highlights user's AWS-dependent services in red
  - Summary: "2 of your 8 services are affected by current incidents"
- Integrate personal blast radius into authenticated dashboard:
  - Replace generic blast radius with personalized version when user has stack entries
  - Show personal blast radius alerts in notification preferences (next phase)

## Acceptance Criteria
- [ ] Users can add/remove services from their stack
- [ ] Autocomplete suggests known services
- [ ] Quick-add presets work
- [ ] Personal blast radius shows affected services from user's stack
- [ ] Concentration risk visible (e.g., "6/8 services on AWS")
- [ ] Commit: "feat: add My Stack with personal blast radius"

## Completion Notes
_(to be filled after task completion)_
