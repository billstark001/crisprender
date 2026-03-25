# CrispRender

A vector-perfect PDF rendering microservice that converts HTML and web pages into crisp PDF documents using headless Chromium.

## Quick Start (Docker)

```bash
docker compose up -d
```

Open <http://localhost:3000> in your browser.

## Quick Start (local, no Docker)

In production mode:

```bash
pnpm install
pnpm build
RATE_LIMIT_FALLBACK_IP=localhost pnpm start
```

In development mode (with hot reload):

```bash
pnpm install
cp .env.example packages/server/.env
pnpm dev          # starts backend :3000 and frontend :5173 in parallel
```

See [docs/development.md](docs/development.md) for full setup instructions and troubleshooting.

## API

### `POST /api/v1/pdf/generate`

| Field             | Type                   | Description                                                                                           |
|-------------------|------------------------|-------------------------------------------------------------------------------------------------------|
| `html`            | `string`               | HTML content to render (mutually exclusive with `url`)                                                |
| `url`             | `string`               | URL to navigate to (mutually exclusive with `html`)                                                   |
| `selector`        | `string`               | CSS selector for target element (optional)                                                            |
| `scale`           | `number`               | Scale factor, default `1.0`                                                                           |
| `format`          | `string`               | Paper format: `A0`–`A5`, `Letter`, `Legal` (optional)                                                 |
| `fitMode`         | `"contain" \| "none"`  | How to fit element on paper, default `"contain"`                                                      |
| `viewportWidth`   | `number`               | Headless browser viewport width in px, default `1280`                                                 |
| `viewportHeight`  | `number`               | Headless browser viewport height in px, default `900`                                                 |
| `waitAfterLoad`   | `number`               | Extra ms to wait after `networkidle0` before rendering, default `0`                                   |
| `injectAttribute` | `boolean`              | Inject `data-crisprender="true"` on `<body>` before rendering, default `true`                        |
| `onRender`        | `string`               | If non-empty, invoke `window[onRender]()` with no arguments before rendering, default `""`            |
| `pruneInvisible`  | `boolean`              | Scroll to the element and shrink the viewport before capturing to reduce output file size. When enabled, applies a Ghostscript + qpdf optimization pipeline via stdio pipes (memory-efficient). Concurrency is limited to prevent resource exhaustion. Default: `false` |

Returns `application/pdf`.

### Ghostscript + qpdf PDF Optimization

When `pruneInvisible` is enabled, the rendered PDF is automatically optimized using a two-step pipeline:

- Step 1: Ghostscript compression
- Step 2: qpdf linearization and image optimization

- **Processing method**: Ghostscript uses stdio streaming; qpdf output is streamed via stdout, and input is written to a temporary file (qpdf does not support PDF input from stdin)
- **Quality preset**: `ebook` (balanced compression and quality)
- **Optimizations applied**:
  - Font compression
  - Duplicate image detection and removal
  - Content compression
  - Resolution optimization (150 DPI)
  - qpdf `--linearize` for faster web viewing
  - qpdf `--optimize-images` for additional image optimization
- **Concurrency control**: Processing is limited to prevent resource exhaustion (max ~2-3 concurrent Ghostscript processes with default 5-page browser concurrency)
- **Fallback**: If Ghostscript or qpdf processing fails, the original PDF is returned without optimization

**Requirements**: Ghostscript and qpdf must be installed on the system. In Docker deployments, both are automatically included.

### Embedding render options via `<meta>` tags

All of the options above (except `html`/`url`) can be embedded directly in the
HTML source as `<meta>` tags.  Values read from meta tags serve as **defaults**
and are overridden by any option explicitly passed in the API request body.

This is particularly useful for self-describing documents that always render the
same way regardless of how they are submitted.

#### Meta-tag name format

For each option CrispRender tries a matrix of name variants, stopping at the
first match found.  The search order is:

| Case style  | Example (`fitMode`) |
|-------------|---------------------|
| kebab-case  | `fit-mode`          |
| snake_case  | `fit_mode`          |
| camelCase   | `fitMode`           |
| PascalCase  | `FitMode`           |

Each case variant is tried with every recognised prefix in order:

| Prefix        | Full example          |
|---------------|-----------------------|
| `crisprender` | `crisprender-fit-mode` |
| `crisp-render`| `crisp-render-fit-mode`|
| `cr`          | `cr-fit-mode`         |
| *(none)*      | `fit-mode`            |

So for `fitMode` the full candidate list is (first match wins):

```
crisprender-fit-mode  crisp-render-fit-mode  cr-fit-mode  fit-mode
crisprender-fit_mode  crisp-render-fit_mode  cr-fit_mode  fit_mode
crisprender-fitMode   crisp-render-fitMode   cr-fitMode   fitMode
crisprender-FitMode   crisp-render-FitMode   cr-FitMode   FitMode
```

The legacy name `pdf-target-selector` is also accepted as an alias for
`selector` for backwards compatibility.

#### Example

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="crisprender-selector"         content="#chart">
  <meta name="crisprender-scale"            content="2">
  <meta name="crisprender-format"           content="A4">
  <meta name="crisprender-fit-mode"         content="contain">
  <meta name="crisprender-viewport-width"   content="1920">
  <meta name="crisprender-viewport-height"  content="1080">
  <meta name="crisprender-wait-after-load"  content="500">
  <meta name="crisprender-inject-attribute" content="true">
  <meta name="crisprender-on-render"        content="prepareForPdf">
  <meta name="crisprender-prune-invisible"  content="true">
</head>
<body>
  <div id="chart"><!-- your content --></div>
</body>
</html>
```

Submitting this HTML without any extra options will render `#chart` at 2× scale
on A4 paper with a 1920×1080 viewport, waiting 500 ms for animations to settle.

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
