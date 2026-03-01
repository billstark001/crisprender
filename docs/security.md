# Security

This document describes CrispRender's security measures and the rationale behind each one.

## Threat Model

| Threat | Impact | Mitigation |
|--------|--------|-----------|
| Abuse / DoS via repeated PDF generation | Server exhaustion | Rate limiting + concurrency cap |
| SSRF via the `url` field | Access internal services | URL allowlist / block-list |
| Oversized HTML payload | OOM / disk exhaustion | Body size limit |
| Sensitive Chromium data leakage | Information disclosure | Request interception |
| XSS injection into served HTML | End-user compromise | `Content-Security-Policy` via secure headers |
| Clickjacking | UI redressing | `X-Frame-Options: DENY` via secure headers |
| MIME-type sniffing | Content confusion | `X-Content-Type-Options: nosniff` |

---

## Implemented Controls

### 1. Rate Limiting

**Middleware:** [`hono-rate-limiter`](https://github.com/rhinobase/hono-rate-limiter)  
**Route:** `POST /api/v1/pdf/generate`

A sliding-window rate limiter caps the number of PDF-generation requests per client IP per minute.

| Env var | Default | Description |
|---------|---------|-------------|
| `RATE_LIMIT` | `20` | Max requests per IP per 60-second window |

The client's real IP is read from `X-Forwarded-For` (first hop) → `X-Real-IP` → `"unknown"`.
`RateLimit-*` response headers conform to the [draft-6 spec](https://tools.ietf.org/id/draft-ietf-httpapi-ratelimit-headers-06.html).

When the limit is exceeded the server returns **429 Too Many Requests**.

---

### 2. Concurrency Cap (Puppeteer Pages)

**File:** `packages/server/src/services/browser.ts`

Puppeteer pages are expensive (~50–100 MB RAM each). A hard cap prevents resource exhaustion under burst traffic.

| Env var | Default | Description |
|---------|---------|-------------|
| `MAX_CONCURRENT_PAGES` | `5` | Maximum simultaneously open Puppeteer pages |

If the cap is reached, new requests receive **503 Service Unavailable** immediately rather than queuing indefinitely.

---

### 3. Request Body Size Limit

**Middleware:** `hono/body-limit`  
**Route:** `/api/v1/pdf/*`

Raw request bodies larger than **11 MB** are rejected at the HTTP layer (before JSON parsing) with **413 Payload Too Large**.

The renderer additionally rejects HTML strings whose UTF-8 byte length exceeds **10 MB** (configurable via `MAX_HTML_BYTES`).

---

### 4. SSRF Protection

**File:** `packages/server/src/services/renderer.ts` → `assertSafeUrl()`

When the `url` parameter is used, the target URL is validated before Puppeteer navigates to it:

- Only `http:` and `https:` protocols are allowed.
- Requests to the following reserved ranges are rejected:
  - Loopback: `127.x.x.x`, `::1`, `localhost`
  - Link-local: `169.254.x.x`, `fe80::/10`
  - RFC 1918 private: `10.x.x.x`, `172.16–31.x.x`, `192.168.x.x`
  - CGNAT: `100.64–127.x.x`
  - Benchmark: `198.18–19.x.x`
  - IPv6 ULA: `fc00::/7` (`fc` and `fd` prefixes)

This prevents the server from being used as a proxy to scan internal infrastructure.

---

### 5. Per-Request Hard Timeout

**Middleware:** `hono/timeout`  
**Renderer:** `renderer.ts` internal `setTimeout`

Two independent timeouts protect against hung pages:

1. **Renderer timeout (15 s):** Force-closes the Puppeteer page if rendering takes too long.
2. **HTTP timeout (18 s):** Hono's `timeout` middleware aborts the HTTP response if the handler hasn't resolved.

---

### 6. Request Interception (Resource Blocking)

**File:** `packages/server/src/services/browser.ts`

Puppeteer's request interception is enabled on every page. The following patterns are aborted:

- `.mp4`, `.mp3` — prevent large media downloads
- `google-analytics.com`, `googlesyndication.com`, `doubleclick.net` — block trackers

This reduces attack surface and speeds up rendering.

---

### 7. Secure HTTP Headers

**Middleware:** `hono/secure-headers`

Applied globally. Sets the following headers on every response:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `no-referrer` |
| `Content-Security-Policy` | strict default-src |

---

## Deployment Recommendations

- **Run behind a reverse proxy** (nginx, Caddy, Traefik) that enforces TLS and provides an additional IP-level rate limiter.
- **Set `PUPPETEER_EXECUTABLE_PATH`** to a system Chromium binary rather than the bundled one to benefit from OS-level security patches.
- **Do not expose port 3000 directly** on a public-facing server; proxy through port 443.
- **Use Docker** with a non-root user (the provided Dockerfile runs as `node`).
