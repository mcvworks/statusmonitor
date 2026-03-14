# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- A domain with DNS access (for `monitor.ducktyped.com`)
- A cloud VM (DigitalOcean, AWS EC2, Linode, etc.)
- OAuth app credentials for desired providers

## Subdomain Setup

### 1. DNS

Add a DNS record for `monitor.ducktyped.com` pointing to your VM:

- **A record:** `monitor` → `<VM_IP_ADDRESS>`
- Or **CNAME:** `monitor` → `<VM_HOSTNAME>`

### 2. Nginx Reverse Proxy

An nginx config is provided at `nginx/monitor.conf`. Install and configure:

```bash
sudo apt install nginx
sudo cp nginx/monitor.conf /etc/nginx/sites-available/monitor.ducktyped.com
sudo ln -s /etc/nginx/sites-available/monitor.ducktyped.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Key features of the nginx config:
- HTTP → HTTPS redirect
- TLS 1.2/1.3 with Let's Encrypt certs
- SSE-friendly settings (buffering disabled, 24h timeouts)
- Static asset caching (365 days for `/_next/static/`, 30 days for images)
- Gzip compression

### 3. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d monitor.ducktyped.com
```

Certbot auto-renews via systemd timer.

### 4. Set AUTH_URL

In your `.env`:
```
AUTH_URL=https://monitor.ducktyped.com
```

## OAuth Provider Setup

All OAuth callback URLs follow the pattern:
```
https://monitor.ducktyped.com/api/auth/callback/{provider}
```

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://monitor.ducktyped.com/api/auth/callback/google`
4. Set in `.env`:
   ```
   AUTH_GOOGLE_ID=<client-id>
   AUTH_GOOGLE_SECRET=<client-secret>
   ```

### Microsoft Entra ID

1. Go to [Azure Portal](https://portal.azure.com/) → Microsoft Entra ID → App registrations
2. New registration → Web platform
3. Add redirect URI: `https://monitor.ducktyped.com/api/auth/callback/microsoft-entra-id`
4. Under Certificates & secrets → New client secret
5. Set in `.env`:
   ```
   AUTH_MICROSOFT_ID=<application-client-id>
   AUTH_MICROSOFT_SECRET=<client-secret-value>
   ```

### Apple

1. Go to [Apple Developer](https://developer.apple.com/) → Certificates, Identifiers & Profiles
2. Register an App ID with "Sign In with Apple" capability
3. Create a Services ID with the return URL: `https://monitor.ducktyped.com/api/auth/callback/apple`
4. Generate a private key for Sign In with Apple
5. Set in `.env`:
   ```
   AUTH_APPLE_ID=<services-id>
   AUTH_APPLE_SECRET=<private-key-content>
   ```

### GitHub

1. Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Set Authorization callback URL: `https://monitor.ducktyped.com/api/auth/callback/github`
3. Set in `.env`:
   ```
   AUTH_GITHUB_ID=<client-id>
   AUTH_GITHUB_SECRET=<client-secret>
   ```

### Email (Magic Link)

Uses Resend by default. Set:
```
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=alerts@monitor.ducktyped.com
```

Or use SMTP fallback:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<username>
SMTP_PASS=<password>
EMAIL_FROM=alerts@monitor.ducktyped.com
```

## Environment Variables Reference

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite connection string. Local: `file:./dev.db`. Docker: `file:/app/data/monitor.db` |
| `AUTH_SECRET` | Auth.js encryption secret. Generate: `openssl rand -base64 32` |
| `AUTH_URL` | Full application URL, e.g. `https://monitor.ducktyped.com` |

### OAuth (optional — enable per provider)

| Variable | Description |
|---|---|
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_MICROSOFT_ID` | Microsoft Entra application ID |
| `AUTH_MICROSOFT_SECRET` | Microsoft Entra client secret |
| `AUTH_APPLE_ID` | Apple Services ID |
| `AUTH_APPLE_SECRET` | Apple private key |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret |

### Notifications (optional)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for email delivery |
| `EMAIL_FROM` | From address for emails. Default: `alerts@monitor.ducktyped.com` |
| `SMTP_HOST` | SMTP server hostname (fallback if no Resend key) |
| `SMTP_PORT` | SMTP port (typically 587) |
| `SMTP_SECURE` | Use TLS (`true`/`false`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for browser push (client-side) |
| `VAPID_PRIVATE_KEY` | VAPID private key for browser push (server-side) |
| `VAPID_SUBJECT` | VAPID contact URI. Default: `mailto:admin@ducktyped.com` |

### Provider API Keys (optional)

| Variable | Description |
|---|---|
| `CLOUDFLARE_RADAR_API_KEY` | Cloudflare Radar API token. Provider skipped if absent |
| `NVD_API_KEY` | NVD API key. Increases rate limits, optional |

### Runtime

| Variable | Description |
|---|---|
| `NODE_ENV` | `development`, `production`, or `test`. Default: `development` |
| `NEXT_PUBLIC_APP_URL` | Client-side application URL reference |

## VAPID Key Generation

For browser push notifications:

```bash
npx web-push generate-vapid-keys
```

Set the output in your `.env`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:admin@ducktyped.com
```

## Docker Deployment

### Build and Run

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Build and start
docker compose up --build -d
```

The container:
1. Runs `prisma migrate deploy` on startup (via `docker-entrypoint.sh`)
2. Starts the Next.js server on port 3000
3. Persists SQLite data in `./data/` via volume mount
4. Health checks via `GET /api/health` every 30 seconds

### Common VM Setup (DigitalOcean / AWS EC2 / Linode)

```bash
# 1. SSH into your VM
ssh root@<vm-ip>

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone the repo
git clone <repo-url> /opt/statusmonitor
cd /opt/statusmonitor

# 4. Configure environment
cp .env.example .env
nano .env  # Set all required variables

# 5. Build and start
docker compose up --build -d

# 6. Install nginx and configure reverse proxy
sudo apt install nginx
sudo cp nginx/monitor.conf /etc/nginx/sites-available/monitor.ducktyped.com
sudo ln -s /etc/nginx/sites-available/monitor.ducktyped.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d monitor.ducktyped.com
sudo systemctl reload nginx

# 7. Verify
curl https://monitor.ducktyped.com/api/health
```

### Auto-Updates with Watchtower (optional)

Uncomment the Watchtower service in `docker-compose.yml` to enable automatic container updates.

## First Run Checklist

- [ ] `.env` configured with all required variables
- [ ] DNS record created for `monitor.ducktyped.com`
- [ ] Docker container running and healthy (`docker compose ps`)
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Health endpoint returns OK: `curl https://monitor.ducktyped.com/api/health`
- [ ] At least one OAuth provider working (try signing in)
- [ ] Alerts appearing on dashboard (wait 2 minutes for first poll)
- [ ] Notifications configured (if desired)
