# Architecture

## Overview

CrispRender is a vector PDF rendering microservice built as a pnpm monorepo.

## Monorepo Layout

```
crisprender-/
├── packages/server   # Hono + Puppeteer backend
└── packages/web      # React + Vite frontend
```

## Backend (packages/server)

- **Hono**: Lightweight HTTP framework running on Node.js via @hono/node-server
- **Puppeteer**: Headless Chromium for pixel-perfect PDF rendering
- **BrowserService**: Singleton managing a shared Chromium instance
- **RendererService**: Converts HTML/URL to PDF with configurable paper formats

## Frontend (packages/web)

- **React 19** + **Vite 6**
- **vanilla-extract**: Zero-runtime CSS-in-TypeScript styling
- **Radix UI**: Accessible component primitives
- **LinguiJS v5**: i18n supporting EN, ZH, JA

## Data Flow

```
User Browser
    │
    ▼
React UI (packages/web)
    │  POST /api/v1/pdf/generate  {html|url, selector, scale, format, fitMode}
    ▼
Hono Server (packages/server)
    │
    ▼
BrowserService (singleton Chromium)
    │  page.goto / page.setContent
    ▼
RendererService
    │  measure bbox → inject CSS → page.pdf()
    ▼
PDF Buffer → HTTP Response (application/pdf)
```
