# Architecture

## Overview

CrispRender is a vector PDF rendering microservice built as a pnpm monorepo.

## Monorepo Layout

```
crisprender/
├── packages/server   # Hono + Puppeteer backend
└── packages/web      # React + Vite frontend
```

## Backend (packages/server)

- **Hono**: Lightweight HTTP framework running on Node.js via `@hono/node-server`
- **Puppeteer**: Headless Chromium for pixel-perfect PDF rendering
- **BrowserService**: Singleton managing a shared Chromium instance with a concurrency cap
- **RendererService**: Converts HTML/URL to PDF with configurable paper formats
- **hono-rate-limiter**: Per-IP sliding-window rate limiter on the generate endpoint
- **hono/body-limit**: Rejects oversized request bodies before parsing
- **hono/timeout**: Hard HTTP-level timeout per request
- **hono/secure-headers**: Sets security-relevant response headers globally

## Frontend (packages/web)

- **React 19** + **Vite 7**
- **vanilla-extract**: Zero-runtime CSS-in-TypeScript styling
- **Radix UI**: Accessible component primitives
- **LinguiJS v5**: i18n supporting EN, ZH, JA

## Request Lifecycle

```
Client
  │  POST /api/v1/pdf/generate  (JSON ≤ 11 MB)
  ▼
Hono middleware stack
  │  1. secureHeaders()        — set X-Frame-Options, CSP, …
  │  2. cors()                 — allow cross-origin
  │  3. rateLimiter()          — reject if > RATE_LIMIT req/min/IP
  │  4. timeout(18 s)          — abort if handler stalls
  │  5. bodyLimit(11 MB)       — reject oversized bodies
  ▼
Route handler (pdf.ts)
  │  — validate field types
  │  — call renderPdf()
  ▼
RendererService
  │  — SSRF check (URL mode)
  │  — HTML size check (html mode)
  │  — acquire page from BrowserService (blocks if pool full)
  │  — 15 s internal timeout
  │  — emulate screen media
  │  — load content  (setContent / goto)
  │  — resolve selector
  │  — measure bbox
  │  — inject CSS
  │  — page.pdf()
  │  — release page
  ▼
HTTP Response  application/pdf
```

## Security & Scalability

See [docs/security.md](security.md) and [docs/load-balancing.md](load-balancing.md) for details.
