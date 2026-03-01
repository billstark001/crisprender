# Load Balancing

This document covers CrispRender's built-in load-management controls and guidance for scaling beyond a single instance.

---

## Single-Instance Controls

### Concurrency Cap

The `BrowserService` allows at most **`MAX_CONCURRENT_PAGES`** (default: 5) Puppeteer pages to be open simultaneously. Requests that exceed the cap receive a **503 Service Unavailable** immediately.

Set `MAX_CONCURRENT_PAGES` in the environment to tune the cap:

```env
MAX_CONCURRENT_PAGES=10
```

Practical upper bound is constrained by available RAM:
- Each Chromium page ≈ 50–150 MB under typical load
- A host with 2 GB free RAM can safely support 10–15 concurrent pages

### Rate Limiter

The `POST /api/v1/pdf/generate` endpoint enforces a per-IP sliding-window rate limit (default: **20 requests / minute**). This prevents a single client from saturating the concurrency pool.

```env
RATE_LIMIT=20        # requests per minute per IP
```

### Per-Request Timeout

Each rendering job has a 15-second hard deadline. Hung pages are force-closed, returning their concurrency slot to the pool.

---

## Multi-Instance (Horizontal Scaling)

Because CrispRender is stateless (no shared database), horizontal scaling is straightforward.

### Docker Compose Scale

```bash
docker compose up -d --scale crisprender=4
```

Put an nginx or Traefik load balancer in front to distribute traffic across replicas.

### Kubernetes

A minimal `Deployment` + `Service`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crisprender
spec:
  replicas: 3
  selector:
    matchLabels:
      app: crisprender
  template:
    metadata:
      labels:
        app: crisprender
    spec:
      containers:
        - name: crisprender
          image: crisprender:latest
          ports:
            - containerPort: 3000
          env:
            - name: MAX_CONCURRENT_PAGES
              value: "5"
            - name: RATE_LIMIT
              value: "20"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1.5Gi"
              cpu: "1"
```

### Reverse-Proxy Rate Limiting

When running multiple replicas the in-process rate limiter is per-instance (not shared). Use a shared store (Redis via `@hono/rate-limiter` adapters or nginx `limit_req`) for global rate limiting:

```nginx
limit_req_zone $binary_remote_addr zone=pdf:10m rate=20r/m;

server {
  location /api/v1/pdf/generate {
    limit_req zone=pdf burst=5 nodelay;
    proxy_pass http://crisprender_upstream;
  }
}
```

---

## Sizing Guidelines

| Workload | `MAX_CONCURRENT_PAGES` | Replicas | Recommended RAM per node |
|----------|-----------------------|----------|--------------------------|
| Dev / demo | 2 | 1 | 512 MB |
| Small team (< 20 RPS) | 5 | 1–2 | 1 GB |
| Production (< 100 RPS) | 8 | 3–5 | 2 GB |
| High-throughput (> 100 RPS) | 10 | 8+ | 4 GB |

> **Note:** Rendering large documents (A0 posters, heavy MathJax) can spike a page's RAM usage to 300 MB+. Lower `MAX_CONCURRENT_PAGES` accordingly.
