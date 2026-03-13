# 020 — Notification Dispatcher & Email Channel (Auth Required)

## Status: done

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
- [x] Dispatcher routes alerts to configured channels
- [x] Email notifications sent via Resend with formatted HTML
- [x] Settings page allows per-channel configuration
- [x] Severity and source filters work correctly
- [x] Test notification button sends a test email
- [x] NotificationLog entries created
- [x] Only authenticated users can configure/receive notifications
- [x] Commit: "feat: add notification dispatcher and email channel"

## Completion Notes
- Created `src/lib/notifications/dispatcher.ts` — batches alerts per user/channel, applies severity + source filters, logs to NotificationLog
- Created `src/lib/notifications/email.ts` — Resend SDK primary, nodemailer SMTP fallback, branded HTML templates with severity badges
- Created `src/lib/notifications/integration.ts` — event bus listener that batches alerts (5s window) before dispatching
- Created `src/app/api/settings/route.ts` — GET/PUT/POST (test) with Zod validation, auth-protected
- Created `src/components/settings/NotificationForm.tsx` — channel toggle, severity/source filters, test notification button
- Created `src/app/dashboard/settings/page.tsx` + `SettingsPage.tsx` — auth-protected settings page
- Created `src/hooks/useNotificationPrefs.ts` — SWR hook for notification preferences CRUD
- Hooked dispatcher into scheduler via `initNotifications()` call at startup
- Installed `nodemailer@^7` + `@types/nodemailer`
- Slack/Teams/Push channels shown as "Coming soon" placeholders
