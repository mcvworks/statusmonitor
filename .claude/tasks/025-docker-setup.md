# 025 — Dockerfile & docker-compose

## Status: done

## Objective
Create a production-ready Docker setup for deploying the app on a cloud VM.

## Requirements
- Create `Dockerfile` (multi-stage build):
  - **Stage 1 (deps)**: Install dependencies
  - **Stage 2 (builder)**: Build Next.js app, generate Prisma client
  - **Stage 3 (runner)**: Minimal production image
    - Use `node:20-alpine`
    - Copy built app, node_modules (production only), Prisma client
    - Copy prisma directory for migrations
    - Set `NODE_ENV=production`
    - Expose port 3000
    - Run migrations on startup, then start app
  - Target final image size < 500MB
- Create `docker-compose.yml`:
  - Service: `statusmonitor`
    - Build from Dockerfile
    - Port mapping: `3000:3000`
    - Volume: `./data:/app/data` (persist SQLite database)
    - Environment variables from `.env`
    - Restart policy: `unless-stopped`
  - Optional: watchtower service for auto-updates
- Create `docker-entrypoint.sh`:
  - Run Prisma migrations (`npx prisma migrate deploy`)
  - Run seed if DB is fresh
  - Start Next.js (`node server.js`)
- Create `.dockerignore`:
  - node_modules, .git, .env, *.md, .next, data/
- Create `nginx/monitor.conf` (example reverse proxy config):
  - Server block for `monitor.ducktyped.com`
  - SSL termination (placeholder for Let's Encrypt certs)
  - Proxy pass to `localhost:3000`
  - WebSocket/SSE-friendly headers (`proxy_buffering off`, `X-Accel-Buffering: no`)
  - Gzip compression
  - Cache static assets (fonts, images, JS/CSS bundles)
- Update `.env.example` with Docker-specific notes and `NEXTAUTH_URL=https://monitor.ducktyped.com`

## Acceptance Criteria
- [x] `docker compose up --build` builds and starts the app
- [x] App accessible at `localhost:3000`
- [x] SQLite database persisted in `./data/` volume
- [x] Migrations run automatically on startup
- [x] Container restarts automatically on crash
- [x] Image size is reasonable (< 500MB)
- [x] Nginx reverse proxy config included for `monitor.ducktyped.com`
- [x] Commit: "feat: add Docker setup with multi-stage build"

## Completion Notes
- Created multi-stage `Dockerfile` (deps → builder → runner) using `node:20-alpine` with `output: 'standalone'` in Next.js config
- Created `docker-compose.yml` with SQLite volume mount (`./data:/app/data`), env_file support, and `unless-stopped` restart policy
- Created `docker-entrypoint.sh` that runs Prisma migrations then starts the standalone server
- Created `.dockerignore` to exclude node_modules, .git, .env, .next, data/, etc.
- Created `nginx/monitor.conf` with SSL termination, SSE-friendly headers (proxy_buffering off, X-Accel-Buffering no), gzip compression, and static asset caching
- Updated `.env.example` with Docker/production notes
- Updated `next.config.ts` to use `output: 'standalone'` for optimized Docker builds
