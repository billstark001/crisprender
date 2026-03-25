import { PDFDocument, type PDFEmbeddedPage } from 'pdf-lib';
import { browserService, MAX_CONCURRENT_PAGES } from './browser.js';
import { paperSizes } from '../utils/paperSizes.js';
import { createLogger } from '../utils/logger.js';
import { processPdfWithGhostscript, processPdfWithQpdf } from '../utils/ghostscript.js';

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
  /**
   * Inject `data-crisprender="true"` on `<body>` before rendering.
   * Useful for environment-specific CSS or JS hooks. Default: true.
   */
  injectAttribute?: boolean;
  /**
   * Optional callback name under `window` to invoke before rendering.
   * Example: `onRender: "prepareForPdf"` calls `window.prepareForPdf()`.
   * Default: empty string (disabled).
   */
  onRender?: string;
  /**
   * When true, scrolls the page to the target element and reduces the
   * headless-browser viewport to the element's dimensions before capturing
   * the intermediate PDF. This eliminates drawing commands for content that
   * lies outside the element's bounding box, producing a smaller output
   * file. Default: false.
   *
   * This is a best-effort optimisation. Pages that depend on fixed-position
   * elements or viewport-sensitive layouts may render differently when this
   * option is enabled.
   */
  pruneInvisible?: boolean;
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
  injectAttribute: metaNameCandidates('injectAttribute'),
  onRender: metaNameCandidates('onRender'),
  pruneInvisible: metaNameCandidates('pruneInvisible'),
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
  if (raw.injectAttribute === 'true' || raw.injectAttribute === '1') opts.injectAttribute = true;
  if (raw.injectAttribute === 'false' || raw.injectAttribute === '0') opts.injectAttribute = false;
  if (raw.onRender !== undefined) opts.onRender = raw.onRender;
  if (raw.pruneInvisible === 'true' || raw.pruneInvisible === '1') opts.pruneInvisible = true;
  return opts;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Element bounding box expressed in PDF point coordinates. */
interface BboxPts {
  /** Left edge in PDF points (x=0 is the left edge of the page). */
  x: number;
  /** Bottom edge in PDF points (y=0 is the bottom edge of the page). */
  y: number;
  /** Width in PDF points. */
  w: number;
  /** Height in PDF points. */
  h: number;
}

/** Brief pause (ms) after viewport resize to allow layout reflow before re-measuring. */
const REFLOW_DELAY_MS = 50;

/** Maximum HTML payload accepted (10 MB). */
const MAX_HTML_BYTES = Number(process.env.MAX_HTML_BYTES ?? 10 * 1024 * 1024);

/** CSS pixels to PDF points: at 96 dpi, 1 CSS pixel = 72/96 pt. */
const PT_PER_PX = 72 / 96;
/** Millimetres to PDF points: 1 mm = 72/25.4 pt. */
const PT_PER_MM = 72 / 25.4;

/**
 * Ghostscript processing queue to manage concurrency.
 * Limits concurrent ghostscript processes to avoid resource exhaustion.
 * Uses the same concurrency limit as browser pages for consistency.
 */
class GhostscriptProcessingQueue {
  private processingCount = 0;
  private readonly maxConcurrent: number;
  private readonly waitlist: Array<() => void> = [];

  constructor(maxConcurrent: number = Math.ceil(MAX_CONCURRENT_PAGES / 2)) {
    this.maxConcurrent = maxConcurrent;
  }

  async process<T>(
    task: () => Promise<T>,
  ): Promise<T> {
    // Wait if queue is at capacity
    while (this.processingCount >= this.maxConcurrent) {
      await new Promise<void>((resolve) => {
        this.waitlist.push(resolve);
      });
    }

    this.processingCount++;
    try {
      return await task();
    } finally {
      this.processingCount--;
      // Notify the next waiting request
      const nextResolve = this.waitlist.shift();
      if (nextResolve) {
        nextResolve();
      }
    }
  }
}

const ghostscriptQueue = new GhostscriptProcessingQueue();

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

/**
 * Add a crop-mode output page to `doc`.
 *
 * The page is sized to the target element scaled by `scale`, and the
 * embedded source page is positioned so the element aligns with the
 * output-page origin (bottom-left corner in PDF coordinates).
 */
function addCropPage(
  doc: PDFDocument,
  src: PDFEmbeddedPage,
  bbox: BboxPts,
  scale: number,
): void {
  const pageW = bbox.w * scale;
  const pageH = bbox.h * scale;
  const page = doc.addPage([pageW, pageH]);
  page.drawPage(src, {
    x: -bbox.x * scale,
    y: -bbox.y * scale,
    xScale: scale,
    yScale: scale,
  });
}

/**
 * Add a poster-mode output page to `doc`.
 *
 * The element is placed on a standard paper sheet using the given `fitMode`.
 * In `contain` mode the element is scaled uniformly to fill the paper while
 * preserving its aspect ratio and centred. In `none` mode the element is
 * placed at the top-left of the paper at the requested `scale`.
 */
function addPosterPage(
  doc: PDFDocument,
  src: PDFEmbeddedPage,
  bbox: BboxPts,
  scale: number,
  format: PaperFormat,
  fitMode: 'contain' | 'none',
): void {
  const paper = paperSizes[format];
  if (!paper) throw new Error(`Unknown paper format: ${format}`);

  const paperW = paper.width * PT_PER_MM;
  const paperH = paper.height * PT_PER_MM;
  const page = doc.addPage([paperW, paperH]);

  let drawScale: number;
  let offsetX: number;
  let offsetY: number;

  if (fitMode === 'contain') {
    const fitScaleX = paperW / bbox.w;
    const fitScaleY = paperH / bbox.h;
    drawScale = Math.min(fitScaleX, fitScaleY) * scale;
    offsetX = (paperW - bbox.w * drawScale) / 2;
    offsetY = (paperH - bbox.h * drawScale) / 2;
  } else {
    // Place element at the top-left of the paper page, scaled.
    drawScale = scale;
    offsetX = 0;
    offsetY = paperH - bbox.h * scale;
  }

  page.drawPage(src, {
    x: offsetX - bbox.x * drawScale,
    y: offsetY - bbox.y * drawScale,
    xScale: drawScale,
    yScale: drawScale,
  });
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
      injectAttribute = true,
      onRender = '',
      pruneInvisible = false,
    } = { ...metaOpts, ...options };

    // If the page embedded different viewport dimensions, re-apply and allow
    // the browser to reflow before we measure.
    const resolvedVW = options.viewportWidth ?? metaOpts.viewportWidth ?? 1280;
    const resolvedVH = options.viewportHeight ?? metaOpts.viewportHeight ?? 900;
    if (resolvedVW !== viewportWidth || resolvedVH !== viewportHeight) {
      await page.setViewport({ width: resolvedVW, height: resolvedVH });
    }

    if (injectAttribute) {
      await page.evaluate(() => {
        document.body?.setAttribute('data-crisprender', 'true');
      });
    }

    const callbackName = onRender.trim();
    if (callbackName) {
      await page.evaluate(async (fnName) => {
        const callback = (window as unknown as Record<string, unknown>)[fnName];
        if (typeof callback !== 'function') {
          throw new Error(`window.${fnName} is not a function`);
        }
        await Promise.resolve((callback as () => unknown)());
      }, callbackName);
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

    // Measure bounding box in the current viewport.
    let bbox = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }, targetSelector) as BoundingBox | null;

    if (!bbox || bbox.width === 0 || bbox.height === 0) {
      throw new Error(`Element not found or has zero dimensions: ${targetSelector}`);
    }

    // --- pruneInvisible optimisation ---
    // Scroll the page so the target element sits at the top-left corner of
    // the viewport, then shrink the viewport to the element's dimensions.
    // This limits what Puppeteer renders in the intermediate PDF to just
    // the element's area, significantly reducing the output file size.
    const pdfWidth = resolvedVW;
    const pdfHeight = resolvedVH;

    // Capture the (possibly reduced) viewport as a PDF.
    const viewportPdfBuffer = await page.pdf({
      width: `${pdfWidth}px`,
      height: `${pdfHeight}px`,
      printBackground: true,
    });

    // Post-process with pdf-lib to crop / place the captured PDF.
    const srcDoc = await PDFDocument.load(viewportPdfBuffer);
    const srcPage = srcDoc.getPages()[0];
    const { height: srcH } = srcPage.getSize();

    const newDoc = await PDFDocument.create();
    const [embeddedPage] = await newDoc.embedPages([srcPage]);

    // Convert the element's browser bounding box to PDF point coordinates.
    // PDF y=0 is at the bottom of the page, so we flip the browser y-axis.
    const bboxPts: BboxPts = {
      x: bbox.x * PT_PER_PX,
      y: srcH - (bbox.y + bbox.height) * PT_PER_PX,
      w: bbox.width * PT_PER_PX,
      h: bbox.height * PT_PER_PX,
    };

    if (!format || format.toLowerCase() === 'none') {
      addCropPage(newDoc, embeddedPage, bboxPts, scale);
      log.info({ format: 'none', durationMs: Date.now() - renderStart }, 'Render completed (crop mode)');
    } else {
      addPosterPage(newDoc, embeddedPage, bboxPts, scale, format as PaperFormat, fitMode);
      log.info({ format, durationMs: Date.now() - renderStart }, 'Render completed (poster mode)');
    }


    let pdfBuffer: Buffer = Buffer.from(await newDoc.save());
    const originalSize = pdfBuffer.length;

    // Apply post-processing pipeline if pruneInvisible is enabled.
    // Order: Ghostscript compression -> qpdf linearize + image optimization.
    if (pruneInvisible) {
      try {
        pdfBuffer = await ghostscriptQueue.process(async () =>
          processPdfWithGhostscript(pdfBuffer, { quality: 'ebook' }),
        );
        pdfBuffer = await ghostscriptQueue.process(async () =>
          processPdfWithQpdf(pdfBuffer),
        );
        log.info(
          { originalSize, processedSize: pdfBuffer.length, compressionSavings: ((1 - pdfBuffer.length / originalSize) * 100).toFixed(1) + '%', durationMs: Date.now() - renderStart },
          'PDF optimized with Ghostscript + qpdf',
        );
      } catch (err) {
        log.warn(
          { err, pruneInvisible },
          'PDF post-processing skipped, returning unoptimized PDF',
        );
        // Continue with unoptimized PDF if Ghostscript or qpdf fails
      }
    }

    return pdfBuffer;
  } finally {
    clearTimeout(timeout);
    await releasePage();
  }
}
