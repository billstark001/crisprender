import { Hono } from 'hono';
import { FormatOptions, RenderOptions, renderPdf } from '../services/renderer.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('pdf');

const pdfRoutes = new Hono();

pdfRoutes.post('/generate', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { html, url, selector, scale, format, fitMode, viewportWidth, viewportHeight, waitAfterLoad } = body;

  if (!html && !url) {
    return c.json({ error: 'Either html or url must be provided' }, 400);
  }

  if (typeof html !== 'undefined' && typeof html !== 'string') {
    return c.json({ error: 'html must be a string' }, 400);
  }
  if (typeof url !== 'undefined' && typeof url !== 'string') {
    return c.json({ error: 'url must be a string' }, 400);
  }
  if (typeof selector !== 'undefined' && typeof selector !== 'string') {
    return c.json({ error: 'selector must be a string' }, 400);
  }
  if (typeof scale !== 'undefined' && typeof scale !== 'number') {
    return c.json({ error: 'scale must be a number' }, 400);
  }
  if (typeof format !== 'undefined' && typeof format !== 'string') {
    return c.json({ error: 'format must be a string' }, 400);
  }
  if (typeof fitMode !== 'undefined' && fitMode !== 'contain' && fitMode !== 'none') {
    return c.json({ error: 'fitMode must be "contain" or "none"' }, 400);
  }
  if (typeof viewportWidth !== 'undefined' && typeof viewportWidth !== 'number') {
    return c.json({ error: 'viewportWidth must be a number' }, 400);
  }
  if (typeof viewportHeight !== 'undefined' && typeof viewportHeight !== 'number') {
    return c.json({ error: 'viewportHeight must be a number' }, 400);
  }
  if (typeof waitAfterLoad !== 'undefined' && typeof waitAfterLoad !== 'number') {
    return c.json({ error: 'waitAfterLoad must be a number' }, 400);
  }

  try {
    const options = Object.fromEntries(
      Object.entries({ html, url, selector, scale, format, fitMode, viewportWidth, viewportHeight, waitAfterLoad })
        .filter(([, value]) => value !== undefined),
    );
    const pdfBuffer = await renderPdf(options as RenderOptions);

    return new Response(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="output.pdf"',
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rendering failed';
    log.error({ err }, 'PDF generation failed: %s', message);
    return c.json({ error: message }, 500);
  }
});

export { pdfRoutes };
