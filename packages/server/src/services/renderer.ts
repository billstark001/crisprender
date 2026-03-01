import { browserService } from './browser.js';
import { paperSizes } from '../utils/paperSizes.js';

export interface RenderOptions {
  html?: string;
  url?: string;
  selector?: string;
  scale?: number;
  format?: string;
  fitMode?: 'contain' | 'none';
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function renderPdf(options: RenderOptions): Promise<Buffer> {
  const { html, url, selector, scale = 1, format, fitMode = 'contain' } = options;

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
    await page.emulateMediaType('screen');

    if (html) {
      await page.setContent(html, { waitUntil: 'networkidle0' });
    } else if (url) {
      await page.goto(url, { waitUntil: 'networkidle0' });
    } else {
      throw new Error('Either html or url must be provided');
    }

    // Resolve target selector
    const targetSelector = await page.evaluate((explicitSelector) => {
      if (explicitSelector) return explicitSelector;
      const meta = document.querySelector('meta[name="pdf-target-selector"]');
      if (meta) {
        const content = meta.getAttribute('content');
        if (content) return content;
      }
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

    if (!format) {
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

      return Buffer.from(pdfBuffer);
    } else {
      // Poster mode: fit element onto paper format
      const paper = paperSizes[format];
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
        format: format as 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'Letter' | 'Legal',
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    }
  } finally {
    clearTimeout(timeout);
    await releasePage();
  }
}
