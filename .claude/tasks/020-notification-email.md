# 020 — Notification Dispatcher & Email Channel (Auth Required)

## Status: queued

## Objective
Build the notification system core and email channel. All notifications require authentication.

## Requirements
- Create `src/lib/notifications/dispatcher.ts`:
  - `dispatchNotifications(alerts: Alert[]): Promise<void>`
  - For each alert, find all users with matching notification prefs
  - Apply filters: severity threshold, source whitelist
  - Batch multiple alerts per poll cycle into single notifications per user/channel
  - Log to NotificationLog table (success/failure per send)
  - Called by polling engine after new alerts detected
- Create `src/lib/notifications/email.ts`:
  - Uses Resend SDK (RESEND_API_KEY, EMAIL_FROM)
  - HTML email template:
    - Subject: "[StatusMonitor] N new alerts — {severity summary}"
    - Body: alert list with severity badges, titles, descriptions, links
    - Footer with unsubscribe/manage preferences link
  - Fallback: nodemailer with SMTP if RESEND_API_KEY not set
- Create `src/app/dashboard/settings/page.tsx`:
  - Notification settings page (authenticated only)
  - Enable/disable each channel
  - Per-channel config (email address auto-filled from account)
  - Severity threshold per channel (e.g., email only for critical+major)
  - Source filter per channel (e.g., only AWS + Azure alerts)
- Create `src/app/api/settings/route.ts`:
  - GET: Fetch user's notification prefs
  - PUT: Update notification prefs
  - Validates with Zod
- Create `src/components/settings/NotificationForm.tsx`:
  - Form UI for notification settings
  - Test button: sends a test notification to verify config
- Hook dispatcher into polling engine: after `pollAll` detects new alerts, call dispatcher

## Acceptance Criteria
- [ ] Dispatcher routes alerts to configured channels
- [ ] Email notifications sent via Resend with formatted HTML
- [ ] Settings page allows per-channel configuration
- [ ] Severity and source filters work correctly
- [ ] Test notification button sends a test email
- [ ] NotificationLog entries created
- [ ] Only authenticated users can configure/receive notifications
- [ ] Commit: "feat: add notification dispatcher and email channel"

## Completion Notes
_(to be filled after task completion)_
