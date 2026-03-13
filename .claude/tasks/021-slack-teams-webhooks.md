# 021 — Slack & Teams Webhook Channels (Auth Required)

## Status: queued

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
- [ ] Slack notifications render with Block Kit formatting
- [ ] Teams notifications render with Adaptive Cards
- [ ] Webhook URLs validated before saving
- [ ] Test buttons verify webhook connectivity
- [ ] Multiple alerts batched into single messages
- [ ] Errors logged to NotificationLog
- [ ] Commit: "feat: add Slack and Teams webhook notification channels"

## Completion Notes
_(to be filled after task completion)_
