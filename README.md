# CrispRender

A vector-perfect PDF rendering microservice that converts HTML and web pages into crisp PDF documents using headless Chromium.

## Quick Start (Docker)

```bash
docker compose up -d
```

Open <http://localhost:3000> in your browser.

## Quick Start (local, no Docker)

```bash
pnpm install
cp .env.example packages/server/.env
pnpm dev          # starts backend :3000 and frontend :5173 in parallel
```

See [docs/development.md](docs/development.md) for full setup instructions and troubleshooting.

## API

### `POST /api/v1/pdf/generate`

| Field       | Type                   | Description                                      |
|-------------|------------------------|--------------------------------------------------|
| `html`      | `string`               | HTML content to render (mutually exclusive with `url`) |
| `url`       | `string`               | URL to navigate to (mutually exclusive with `html`)    |
| `selector`  | `string`               | CSS selector for target element (optional)       |
| `scale`     | `number`               | Scale factor, default `1.0`                      |
| `format`    | `string`               | Paper format: `A0`–`A5`, `Letter`, `Legal` (optional) |
| `fitMode`   | `"contain" \| "none"` | How to fit element on paper, default `"contain"` |

Returns `application/pdf`.

### Example

```bash
curl -X POST http://localhost:3000/api/v1/pdf/generate \
  -H 'Content-Type: application/json' \
  -d '{"html":"<h1>Hello</h1>","format":"A4"}' \
  --output hello.pdf
```

## Documentation

- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Load Balancing](docs/load-balancing.md)
