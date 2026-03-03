import { browserService } from './browser.js';
import { paperSizes } from '../utils/paperSizes.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('renderer');
import { PaperFormat } from 'puppeteer';
import { toKebab, toSnake, toPascal } from '../utils/string.js';

export type FormatOptions = PaperFormat | 'None' | 'none';

export interface RenderOptions {
  html?: string;
  url?: string;
  selector?: string;
  scale?: number;
  format?: FormatOptions;
  fitMode?: 'contain' | 'none';
  /** Headless browser viewport width in pixels (default: 1280). */
  viewportWidth?: number;
  /** Headless browser viewport height in pixels (default: 900). */
  viewportHeight?: number;
  /** Extra milliseconds to wait after page load before measuring / rendering (default: 0). */
  waitAfterLoad?: number;
}

/**
 * Generate all meta-tag `name` candidates for a camelCase option name.
 *
 * For each case style (kebab → snake → camelCase → PascalCase) the function
 * tries every recognised prefix in order: `crisprender`, `crisp-render`, `cr`,
 * and no-prefix — giving 16 candidates per option (with duplicates removed).
 *
 * Example — `fitMode` produces (among others):
 *   `crisprender-fit-mode`, `crisp-render-fit-mode`, `cr-fit-mode`, `fit-mode`,
 *   `crisprender-fit_mode`, …, `crisprender-FitMode`, …, `FitMode`
 */
export function metaNameCandidates(camelName: string): string[] {
  const kebab = toKebab(camelName);
  const snake = toSnake(camelName);
  const pascal = toPascal(camelName);
  const prefixes = ['crisprender', 'crisp-render', 'cr', ''] as const;
  const caseVariants = [kebab, snake, camelName, pascal];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const variant of caseVariants) {
    for (const prefix of prefixes) {
      const candidate = prefix ? `${prefix}-${variant}` : variant;
      if (!seen.has(candidate)) {
        seen.add(candidate);
        result.push(candidate);
      }
    }
  }
  return result;
}

/**
 * Pre-computed meta-tag name candidates for every configurable RenderOption
 * (excluding `html` and `url` which are inputs, not rendering settings).
 */
const OPTION_CANDIDATES = {
  selector: [
    // Legacy name kept for backwards compatibility
    'pdf-target-selector',
    ...metaNameCandidates('selector'),
  ],
  scale: metaNameCandidates('scale'),
  format: metaNameCandidates('format'),
  fitMode: metaNameCandidates('fitMode'),
  viewportWidth: metaNameCandidates('viewportWidth'),
  viewportHeight: metaNameCandidates('viewportHeight'),
  waitAfterLoad: metaNameCandidates('waitAfterLoad'),
} as const satisfies Partial<Record<keyof RenderOptions, readonly string[]>>;

/**
 * Read render-option defaults embedded in the page's `<meta>` tags.
 *
 * All values found here are **overridden** by any explicit option passed by
 * the caller.  The search order for each option follows the candidate list
 * produced by {@link metaNameCandidates}: kebab → snake → camelCase →
 * PascalCase, each with prefixes `crisprender` → `crisp-render` → `cr` → ∅.
 *
 * @param page - A Puppeteer `Page` that has already loaded its content.
 * @returns A partial `RenderOptions` with typed values (strings coerced).
 */
export async function extractMetaOptions(
  page: import('puppeteer').Page,
): Promise<Partial<RenderOptions>> {
  // Serialise the candidates map so it can be transferred into the browser ctx.
  const candidatesMap = OPTION_CANDIDATES as Record<string, readonly string[]>;

  const raw = await page.evaluate((candidates: Record<string, string[]>) => {
    const result: Record<string, string> = {};
    for (const [key, names] of Object.entries(candidates)) {
      for (const name of names) {
        const el = document.querySelector(`meta[name="${name}"]`);
        if (el) {
          const val = el.getAttribute('content');
          if (val !== null) {
            result[key] = val;
            break;
          }
        }
      }
    }
    return result;
  }, candidatesMap as Record<string, string[]>);

  // Coerce raw string values to their proper types.
  const opts: Partial<RenderOptions> = {};
  if (raw.selector) opts.selector = raw.selector;
  if (raw.scale !== undefined) { const n = parseFloat(raw.scale); if (!isNaN(n)) opts.scale = n; }
  if (raw.format) opts.format = raw.format as FormatOptions;
  if (raw.fitMode === 'contain' || raw.fitMode === 'none') opts.fitMode = raw.fitMode;
  if (raw.viewportWidth !== undefined) { const n = parseInt(raw.viewportWidth, 10); if (!isNaN(n) && n > 0) opts.viewportWidth = n; }
  if (raw.viewportHeight !== undefined) { const n = parseInt(raw.viewportHeight, 10); if (!isNaN(n) && n > 0) opts.viewportHeight = n; }
  if (raw.waitAfterLoad !== undefined) { const n = parseInt(raw.waitAfterLoad, 10); if (!isNaN(n) && n >= 0) opts.waitAfterLoad = n; }
  return opts;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Maximum HTML payload accepted (10 MB). */
const MAX_HTML_BYTES = Number(process.env.MAX_HTML_BYTES ?? 10 * 1024 * 1024);

/**
 * Private/reserved IP ranges blocked to prevent SSRF attacks.
 * Covers: loopback, link-local (169.254/16), RFC-1918, CGNAT (100.64/10),
 * benchmark (198.18/15), IPv6 loopback (::1), ULA (fc00::/7), link-local (fe80::/10).
 */
const SSRF_BLOCK_RE =
  /^https?:\/\/(localhost|127\.|0\.0\.0|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|198\.(1[89])\.|::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/i;

function assertSafeUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed');
  }
  if (SSRF_BLOCK_RE.test(url)) {
    throw new Error('URL resolves to a private or loopback address');
  }
}

export async function renderPdf(options: RenderOptions): Promise<Buffer> {
  const {
    html,
    url,
    // Viewport / timing must be known before page load; apply defaults here.
    viewportWidth = 1280,
    viewportHeight = 900,
  } = options;

  // Validate HTML size
  if (html && Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    throw new Error(`HTML payload exceeds the ${MAX_HTML_BYTES / 1024 / 1024} MB limit`);
  }

  // SSRF guard for URL mode
  if (url) {
    assertSafeUrl(url);
  }

  const renderStart = Date.now();
  log.info({ mode: html ? 'html' : 'url', url: url ?? undefined }, 'Render started');

  const page = await browserService.getPage();
  let released = false;

  const releasePage = async () => {
    if (!released) {
      released = true;
      await browserService.releasePage(page);
    }
  };

  const timeout = setTimeout(() => { void releasePage(); }, 15000);

  try {
    await page.setViewport({ width: viewportWidth, height: viewportHeight });
    await page.emulateMediaType('screen');

    if (html) {
      await page.setContent(html, { waitUntil: 'networkidle0' });
    } else if (url) {
      await page.goto(url, { waitUntil: 'networkidle0' });
    } else {
      throw new Error('Either html or url must be provided');
    }

    // Read rendering defaults from the page's <meta> tags.
    // Explicit API options take precedence over meta-tag values.
    const metaOpts = await extractMetaOptions(page);
    const {
      selector,
      scale = 1,
      format,
      fitMode = 'contain',
      waitAfterLoad = 0,
    } = { ...metaOpts, ...options };

    // If the page embedded different viewport dimensions, re-apply and allow
    // the browser to reflow before we measure.
    const resolvedVW = options.viewportWidth ?? metaOpts.viewportWidth ?? 1280;
    const resolvedVH = options.viewportHeight ?? metaOpts.viewportHeight ?? 900;
    if (resolvedVW !== viewportWidth || resolvedVH !== viewportHeight) {
      await page.setViewport({ width: resolvedVW, height: resolvedVH });
    }

    // Optional extra delay for JS-driven animations (e.g. D3 force simulations)
    if (waitAfterLoad > 0) {
      log.info({ waitAfterLoad }, 'Waiting extra time after load');
      await new Promise((resolve) => setTimeout(resolve, waitAfterLoad));
    }

    // Resolve target selector.
    // Priority: (1) explicit API option or meta-tag value (already in `selector`),
    //           (2) [data-pdf-target="true"] element as a convenience fallback,
    //           (3) <body>.
    const targetSelector = await page.evaluate((explicitSelector) => {
      if (explicitSelector) return explicitSelector;
      const dataTarget = document.querySelector('[data-pdf-target="true"]');
      if (dataTarget) {
        // Build a unique selector for this element
        if (dataTarget.id) return `#${dataTarget.id}`;
        if (dataTarget.className) return `.${String(dataTarget.className).trim().split(/\s+/).join('.')}`;
        return 'body';
      }
      return 'body';
    }, selector ?? null);

    // Measure bounding box
    const bbox = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }, targetSelector) as BoundingBox | null;

    if (!bbox || bbox.width === 0 || bbox.height === 0) {
      throw new Error(`Element not found or has zero dimensions: ${targetSelector}`);
    }

    if (!format || format.toLowerCase() === 'none') {
      // Illustration mode: crop to element
      const pdfWidth = bbox.width * scale;
      const pdfHeight = bbox.height * scale;

      await page.addStyleTag({
        content: `html { transform: translate(-${bbox.x}px, -${bbox.y}px); }`,
      });

      const pdfBuffer = await page.pdf({
        width: `${pdfWidth}px`,
        height: `${pdfHeight}px`,
        printBackground: true,
      });

      log.info({ format: 'none', durationMs: Date.now() - renderStart }, 'Render completed (crop mode)');
      return Buffer.from(pdfBuffer);
    } else {
      // Poster mode: fit element onto paper format
      const paper = paperSizes[format as PaperFormat];
      if (!paper) {
        throw new Error(`Unknown paper format: ${format}`);
      }

      let cssTransform = '';
      if (fitMode === 'contain') {
        const scaleX = paper.width / (bbox.width * 0.2645833); // px to mm (1px = 0.2645833mm at 96dpi)
        const scaleY = paper.height / (bbox.height * 0.2645833);
        const fitScale = Math.min(scaleX, scaleY) * scale;
        const translateX = (paper.width / 0.2645833 - bbox.width * fitScale) / 2 - bbox.x * fitScale;
        const translateY = (paper.height / 0.2645833 - bbox.height * fitScale) / 2 - bbox.y * fitScale;
        cssTransform = `html { transform-origin: 0 0; transform: translate(${translateX}px, ${translateY}px) scale(${fitScale}); }`;
      } else {
        cssTransform = `html { transform: translate(-${bbox.x}px, -${bbox.y}px); }`;
      }

      await page.addStyleTag({ content: cssTransform });

      const pdfBuffer = await page.pdf({
        format: format as PaperFormat,
        printBackground: true,
      });

      log.info({ format, durationMs: Date.now() - renderStart }, 'Render completed (poster mode)');
      return Buffer.from(pdfBuffer);
    }
  } finally {
    clearTimeout(timeout);
    await releasePage();
  }
}
