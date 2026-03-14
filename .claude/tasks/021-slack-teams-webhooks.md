# 021 — Slack & Teams Webhook Channels (Auth Required)

## Status: done

## Objective
Add Slack and Microsoft Teams notification channels using incoming webhooks.

## Requirements
- Create `src/lib/notifications/slack.ts`:
  - Sends formatted Slack messages via incoming webhook URL
  - Block Kit formatting:
    - Header with severity emoji + alert count
    - Section per alert: title, source, severity, description, link button
    - Color sidebar matching severity (red/orange/yellow/blue)
  - Batches multiple alerts into single message
  - Handles webhook errors gracefully
- Create `src/lib/notifications/teams.ts`:
  - Sends Adaptive Card formatted messages via Teams incoming webhook
  - Card layout:
    - Title with alert count and severity
    - Facts: source, severity, status, time
    - Description text
    - Action button linking to alert source
    - Color accent matching severity
  - Batches multiple alerts into single card
- Update `src/components/settings/ChannelConfig.tsx`:
  - Slack config: webhook URL input, test button
  - Teams config: webhook URL input, test button
  - Inline validation of webhook URL format
  - Instructions/help text for setting up webhooks in each platform
- Register both channels in the dispatcher
- Test buttons send a sample alert to verify webhook works

## Acceptance Criteria
- [x] Slack notifications render with Block Kit formatting
- [x] Teams notifications render with Adaptive Cards
- [x] Webhook URLs validated before saving
- [x] Test buttons verify webhook connectivity
- [x] Multiple alerts batched into single messages
- [x] Errors logged to NotificationLog
- [x] Commit: "feat: add Slack and Teams webhook notification channels"

## Completion Notes
- Created `src/lib/notifications/slack.ts` with Block Kit formatting (header, per-alert sections with severity emoji, source, description, view button, color sidebar via attachments)
- Created `src/lib/notifications/teams.ts` with Adaptive Card format (title, FactSet with source/severity/status/time, description, action button)
- Both channels batch multiple alerts into a single message
- Registered both channels in dispatcher — errors are logged to NotificationLog via existing dispatcher logic
- Updated settings API POST handler to support Slack/Teams test notifications (fetches saved webhook URL from DB)
- Updated NotificationForm: Slack and Teams now appear as full channels with webhook URL input, inline URL validation (pattern matching), setup help links, severity/source filters, and test buttons
- Browser Push remains as "Coming soon"
