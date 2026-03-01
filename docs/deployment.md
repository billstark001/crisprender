# Deployment

## Docker (Recommended)

```bash
docker compose up -d
```

The service will be available at http://localhost:3000.

## Environment Variables

| Variable              | Default | Description                          |
|-----------------------|---------|--------------------------------------|
| `PORT`                | `3000`  | HTTP port to listen on               |
| `ADSENSE_CLIENT`      | *(empty)* | Google AdSense publisher ID        |
| `PUPPETEER_EXECUTABLE_PATH` | *(bundled)* | Path to Chromium binary    |

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
