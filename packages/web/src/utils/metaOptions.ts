/**
 * Client-side utilities for reading CrispRender render options from
 * `<meta>` tags embedded in an HTML string.
 *
 * The logic mirrors the server-side `metaNameCandidates` / `extractMetaOptions`
 * functions in `packages/server/src/services/renderer.ts`.
 */

/** Recognized render-option keys (mirrors server-side RenderOptions). */
export type MetaRenderOptions = {
  selector?: string;
  scale?: number;
  format?: string;
  fitMode?: 'contain' | 'none';
  viewportWidth?: number;
  viewportHeight?: number;
  waitAfterLoad?: number;
};

// ---------------------------------------------------------------------------
// Name-candidate generation (identical algorithm to the server)
// ---------------------------------------------------------------------------

function toKebab(name: string): string {
  return name.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`);
}

function toSnake(name: string): string {
  return name.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
}

function toPascal(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Generate all meta-tag name candidates for a camelCase option name. */
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

/** Pre-computed candidates for every configurable option. */
export const OPTION_CANDIDATES: Record<keyof MetaRenderOptions, string[]> = {
  selector: ['pdf-target-selector', ...metaNameCandidates('selector')],
  scale: metaNameCandidates('scale'),
  format: metaNameCandidates('format'),
  fitMode: metaNameCandidates('fitMode'),
  viewportWidth: metaNameCandidates('viewportWidth'),
  viewportHeight: metaNameCandidates('viewportHeight'),
  waitAfterLoad: metaNameCandidates('waitAfterLoad'),
};

// ---------------------------------------------------------------------------
// HTML-string parser
// ---------------------------------------------------------------------------

/**
 * Parse an HTML string and extract any CrispRender render-option values
 * embedded as `<meta>` tags.
 *
 * Uses `DOMParser` (browser-native) so no external dependencies are needed.
 * Returns only the options that were actually found.
 */
export function extractMetaOptionsFromHtml(html: string): MetaRenderOptions {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return {};
  }

  function getMeta(names: string[]): string | null {
    for (const name of names) {
      const el = doc.querySelector(`meta[name="${name}"]`);
      if (el) {
        const val = el.getAttribute('content');
        if (val !== null) return val;
      }
    }
    return null;
  }

  const opts: MetaRenderOptions = {};

  const selector = getMeta(OPTION_CANDIDATES.selector);
  if (selector) opts.selector = selector;

  const scale = getMeta(OPTION_CANDIDATES.scale);
  if (scale !== null) { const n = parseFloat(scale); if (!isNaN(n)) opts.scale = n; }

  const format = getMeta(OPTION_CANDIDATES.format);
  if (format) opts.format = format;

  const fitMode = getMeta(OPTION_CANDIDATES.fitMode);
  if (fitMode === 'contain' || fitMode === 'none') opts.fitMode = fitMode;

  const viewportWidth = getMeta(OPTION_CANDIDATES.viewportWidth);
  if (viewportWidth !== null) { const n = parseInt(viewportWidth, 10); if (!isNaN(n) && n > 0) opts.viewportWidth = n; }

  const viewportHeight = getMeta(OPTION_CANDIDATES.viewportHeight);
  if (viewportHeight !== null) { const n = parseInt(viewportHeight, 10); if (!isNaN(n) && n > 0) opts.viewportHeight = n; }

  const waitAfterLoad = getMeta(OPTION_CANDIDATES.waitAfterLoad);
  if (waitAfterLoad !== null) { const n = parseInt(waitAfterLoad, 10); if (!isNaN(n) && n >= 0) opts.waitAfterLoad = n; }

  return opts;
}
