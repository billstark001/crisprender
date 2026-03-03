# Development Guide

Step-by-step instructions for running CrispRender locally **without Docker**.

---

## Prerequisites

| Tool | Minimum version | Install |
|------|-----------------|---------|
| Node.js | 22 | [nodejs.org](https://nodejs.org) or `nvm install 22` |
| pnpm | 9 | `npm install -g pnpm` |
| Chromium | any recent | see below |

### Chromium

The backend relies on Puppeteer, which **downloads a compatible Chromium build automatically** when you run `pnpm install`. No manual installation is required for most platforms.

If the automatic download fails (e.g., corporate proxies, CI, WSL2), install Chromium manually and point Puppeteer at it:

```bash
# macOS (Homebrew)
brew install --cask chromium

# Debian / Ubuntu
sudo apt-get install -y chromium-browser

# Arch Linux
sudo pacman -S chromium
```

Then set the environment variable:

```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## Setup

```bash
git clone https://github.com/billstark001/crisprender.git
cd crisprender
pnpm install
```

Copy the example environment file:

```bash
cp .env.example packages/server/.env
```

Edit `packages/server/.env` as needed (all defaults are fine for local development).

---

## Start Dev Servers

Open **two terminals** (or use a process manager like `concurrently`):

```bash
# Terminal 1 — backend with hot-reload (tsx watch)
pnpm --filter @crisprender/server run dev

# Terminal 2 — frontend with Vite HMR
pnpm --filter @crisprender/web run dev
```

Or start both in parallel from the root:

```bash
pnpm dev
```

The frontend Vite dev server listens on **<http://localhost:5173>** and proxies `/api/*` requests to the backend at **<http://localhost:3000>**.

> **Note:** The backend starts Chromium on the first PDF request, not on server start. The first request may be slow (~2–5 s) while Chromium initialises.

---

## Environment Variables

Create `packages/server/.env` (or export in your shell):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `ADSENSE_CLIENT` | *(empty)* | Google AdSense publisher ID |
| `PUPPETEER_EXECUTABLE_PATH` | *(bundled)* | Path to Chromium binary |
| `MAX_CONCURRENT_PAGES` | `5` | Concurrent Puppeteer pages |
| `MAX_HTML_BYTES` | `10485760` | Max HTML payload (bytes) |
| `RATE_LIMIT` | `20` | Requests per minute per IP |

For the frontend, create `packages/web/.env.local`:

| Variable | Description |
|----------|-------------|
| `VITE_ADSENSE_CLIENT` | Google AdSense client ID (shows ad slot in UI) |

---

## Build

```bash
pnpm build          # builds both web and server
```

Output:

- Frontend → `packages/web/dist/`
- Backend → `packages/server/dist/`

---

## i18n

To add or update translations:

```bash
# Extract new message IDs from source
pnpm --filter @crisprender/web run extract

# Edit packages/web/src/locales/{en,zh,ja}.po

# Compile (optional — Vite plugin compiles on-the-fly in dev)
pnpm --filter @crisprender/web run compile
```

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| `Error: Failed to launch the browser process` | Set `PUPPETEER_EXECUTABLE_PATH` or run `pnpm install` to re-download Chromium |
| `ECONNREFUSED` on API calls from frontend | Make sure the backend (`pnpm --filter @crisprender/server run dev`) is running |
| Port 3000 already in use | Change `PORT` in `.env` and update `packages/web/vite.config.ts` proxy target |
| Blank PDF on Linux | Install missing fonts: `sudo apt-get install fonts-noto fonts-noto-cjk` |
