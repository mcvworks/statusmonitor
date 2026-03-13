# 022 — Browser Push Notifications (Auth Required)

## Status: queued

## Objective
Add browser push notifications using the Web Push API with VAPID keys.

## Requirements
- Generate VAPID keys (document in setup guide):
  - `npx web-push generate-vapid-keys`
  - Store as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env
- Create `src/app/api/push/vapid/route.ts`:
  - GET: Returns VAPID public key (public endpoint, needed by service worker)
- Create `src/app/api/push/subscribe/route.ts`:
  - POST: Save push subscription for authenticated user
  - DELETE: Remove push subscription
  - Validates subscription object with Zod
- Create `src/lib/notifications/web-push.ts`:
  - Uses `web-push` library with VAPID credentials
  - Sends push notification with:
    - Title: "[Severity] Source — Alert Title"
    - Body: truncated description
    - Icon: app icon
    - Badge: severity-colored icon
    - Data: alert URL for click-to-open
  - Handles expired/invalid subscriptions (remove from DB)
- Create `public/sw.js` (service worker):
  - Listens for `push` events, displays notification
  - Handles `notificationclick` — opens alert URL or dashboard
  - Self-registration logic
- Create `src/hooks/usePushNotifications.ts`:
  - Check browser support
  - Request notification permission
  - Subscribe/unsubscribe to push
  - Register service worker
  - Returns: `{ isSupported, permission, isSubscribed, subscribe, unsubscribe }`
- Update settings page with push notification toggle and permission request UI
- Show browser-specific help if notifications blocked

## Acceptance Criteria
- [ ] Service worker registers and receives push events
- [ ] Push notifications display with correct title/body/icon
- [ ] Clicking notification opens relevant URL
- [ ] Subscribe/unsubscribe persisted to DB per user
- [ ] Expired subscriptions cleaned up automatically
- [ ] Settings UI shows permission state and toggle
- [ ] Only authenticated users can subscribe
- [ ] Commit: "feat: add browser push notifications"

## Completion Notes
_(to be filled after task completion)_
