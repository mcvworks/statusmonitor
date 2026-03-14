# API Reference

All endpoints are under `/api/`. Authenticated endpoints require a valid session cookie.

## Alerts

### GET /api/alerts

Fetch active alerts with filtering and pagination.

**Auth:** Public

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by category (cloud, devops, security, isp) |
| `severity` | string | — | Filter by severity (critical, major, minor, info) |
| `source` | string | — | Filter by provider name |
| `status` | string | — | Filter by status (active, resolved, investigating, monitoring) |
| `limit` | number | 50 | Results per page (max 200) |
| `offset` | number | 0 | Pagination offset |

**Response:**
```json
{
  "alerts": [
    {
      "id": "clx...",
      "externalId": "abc123",
      "source": "aws",
      "category": "cloud",
      "severity": "major",
      "title": "Increased API Error Rates",
      "description": "We are investigating...",
      "url": "https://status.aws.amazon.com/...",
      "region": "us-east-1",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "status": "investigating",
      "resolvedAt": null,
      "userState": null
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

When authenticated, each alert includes `userState` with the user's ack/snooze/dismiss state.

### GET /api/alerts/history

Fetch historical alerts with stats.

**Auth:** Public

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `category` | string | — | Filter by category |
| `severity` | string | — | Filter by severity |
| `source` | string | — | Filter by provider name |
| `status` | string | — | Filter by status |
| `startDate` | ISO date | — | Start of date range |
| `endDate` | ISO date | — | End of date range |
| `sort` | string | `timestamp` | Sort field: timestamp, severity, source, status, resolvedAt |
| `order` | string | `desc` | Sort order: asc, desc |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Results per page (max 200) |

**Response:**
```json
{
  "alerts": [...],
  "total": 1250,
  "page": 1,
  "limit": 50,
  "totalPages": 25,
  "hasMore": true,
  "stats": {
    "totalIncidents": 1250,
    "avgResolutionMinutes": 45.2,
    "severityBreakdown": {
      "critical": 12,
      "major": 89,
      "minor": 340,
      "info": 809
    },
    "topSources": [
      { "source": "aws", "count": 150 },
      { "source": "cloudflare", "count": 120 }
    ]
  }
}
```

### GET /api/alerts/sse

Server-Sent Events stream for real-time alert updates.

**Auth:** Public

**Content-Type:** `text/event-stream`

**Events:**
- `data: {"type": "alert:new", ...alert}` — new alert created
- `data: {"type": "alert:updated", ...alert}` — alert status/severity changed
- `data: {"type": "alert:resolved", ...alert}` — alert resolved
- `: heartbeat` — keepalive comment every 30 seconds

### PATCH /api/alerts/[id]

Set user state for an alert (acknowledge, snooze, or dismiss).

**Auth:** Required

**Body:**
```json
{
  "state": "acknowledged",
  "snoozedUntil": null
}
```

Valid states: `acknowledged`, `snoozed`, `dismissed`. Include `snoozedUntil` (ISO datetime) when state is `snoozed`.

**Response:** `{ "success": true, "state": {...} }`

### DELETE /api/alerts/[id]

Remove user state for an alert (un-acknowledge, un-snooze).

**Auth:** Required

**Response:** `{ "success": true }`

## Dashboard

### GET /api/dashboard

Get all saved dashboards for the authenticated user.

**Auth:** Required

**Response:**
```json
{
  "dashboards": [
    {
      "id": "clx...",
      "name": "My Cloud View",
      "layout": {...},
      "pinnedServices": ["aws", "cloudflare"],
      "filters": { "category": "cloud" },
      "isDefault": true
    }
  ]
}
```

### POST /api/dashboard

Create a new saved dashboard.

**Auth:** Required

**Body:**
```json
{
  "name": "Production Services",
  "pinnedServices": ["aws", "gcp", "cloudflare"],
  "selectedServices": ["aws", "gcp"],
  "filters": { "severity": "critical" },
  "isDefault": false
}
```

### PUT /api/dashboard

Update an existing dashboard.

**Auth:** Required

**Body:** Same as POST, plus `"id": "clx..."`.

### DELETE /api/dashboard

Delete a dashboard.

**Auth:** Required

**Body:** `{ "id": "clx..." }`

## My Stack

### GET /api/stack

Get the user's infrastructure dependency stack.

**Auth:** Required

**Response:**
```json
{
  "stack": [
    {
      "id": "clx...",
      "serviceName": "API Gateway",
      "provider": "aws",
      "region": "us-east-1",
      "notes": "Production API"
    }
  ]
}
```

### POST /api/stack

Add services to the user's stack.

**Auth:** Required

**Single:**
```json
{
  "serviceName": "API Gateway",
  "provider": "aws",
  "region": "us-east-1",
  "notes": "Production API"
}
```

**Bulk (up to 50):**
```json
{
  "services": [
    { "serviceName": "API Gateway", "provider": "aws" },
    { "serviceName": "CDN", "provider": "cloudflare" }
  ]
}
```

### DELETE /api/stack

Remove a service from the stack.

**Auth:** Required

**Body:** `{ "id": "clx..." }`

## Dependencies

### GET /api/dependencies

Query the blast radius dependency map.

**Auth:** Public

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `provider` | string | Get services affected by this provider |
| `service` | string | Reverse lookup — which providers does this service depend on |
| `active` | `true` | Enrich results with live alert status |
| `region` | string | Filter by region |

No parameters returns the entire dependency map.

**Response (with `provider=aws&active=true`):**
```json
{
  "provider": "aws",
  "services": [
    {
      "service": "Slack",
      "confidence": "confirmed",
      "regions": ["us-east-1"],
      "source": "https://...",
      "hasActiveAlert": false
    }
  ]
}
```

## Notification Settings

### GET /api/settings

Get notification preferences.

**Auth:** Required

**Response:**
```json
{
  "prefs": [
    {
      "id": "clx...",
      "channel": "email",
      "enabled": true,
      "config": {},
      "severityFilter": ["critical", "major"],
      "sourceFilter": []
    }
  ]
}
```

### PUT /api/settings

Update notification preferences.

**Auth:** Required

**Body:**
```json
{
  "prefs": [
    {
      "channel": "email",
      "enabled": true,
      "config": {},
      "severityFilter": ["critical", "major"],
      "sourceFilter": ["aws", "gcp"]
    },
    {
      "channel": "slack",
      "enabled": true,
      "config": { "webhookUrl": "https://hooks.slack.com/..." },
      "severityFilter": ["critical"],
      "sourceFilter": []
    }
  ]
}
```

### POST /api/settings

Send a test notification.

**Auth:** Required

**Body:**
```json
{
  "action": "test",
  "channel": "email"
}
```

Valid channels: `email`, `slack`, `teams`, `push`.

## Push Notifications

### POST /api/push/subscribe

Register a browser push subscription.

**Auth:** Required

**Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### DELETE /api/push/subscribe

Unregister a push subscription.

**Auth:** Required

**Body:** `{ "endpoint": "https://..." }`

### GET /api/push/vapid

Get the VAPID public key for push subscription.

**Auth:** Public

**Response:** `{ "publicKey": "BNx..." }`

Returns 503 if VAPID keys are not configured.

## Health

### GET /api/health

Application health check.

**Auth:** Public

**Response:**
```json
{
  "status": "ok",
  "uptime": 86400,
  "version": "1.0.0",
  "providers": {
    "total": 22,
    "healthy": 22,
    "errored": 0
  },
  "lastPoll": "2025-01-15T10:30:00.000Z",
  "dbConnected": true
}
```

Returns HTTP 503 if the database is unreachable (`status: "degraded"`).

## Error Responses

All error responses follow this format:

```json
{
  "error": "Description of the error"
}
```

Common HTTP status codes:
- `400` — Invalid request parameters
- `401` — Authentication required
- `404` — Resource not found
- `500` — Internal server error
- `503` — Service unavailable (health check only)
