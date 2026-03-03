# Deployment

## Docker (Recommended)

```bash
docker compose up -d
```

The service will be available at <http://localhost:3000>.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port to listen on |
| `ADSENSE_CLIENT` | *(empty)* | Google AdSense publisher ID |
| `PUPPETEER_EXECUTABLE_PATH` | *(bundled)* | Path to Chromium binary |
| `MAX_CONCURRENT_PAGES` | `5` | Maximum concurrent Puppeteer pages |
| `MAX_HTML_BYTES` | `10485760` | Maximum HTML payload in bytes (10 MB) |
| `RATE_LIMIT` | `20` | Requests per minute per IP on the generate endpoint |

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 9+

### Setup

```bash
pnpm install
```

### Start dev servers

```bash
# Backend (hot-reload)
pnpm --filter @crisprender/server run dev

# Frontend (Vite HMR)
pnpm --filter @crisprender/web run dev
```

### Build

```bash
pnpm build
```
