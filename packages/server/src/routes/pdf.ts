import { Hono } from 'hono';
import { renderPdf } from '../services/renderer.js';

const pdfRoutes = new Hono();

pdfRoutes.post('/generate', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { html, url, selector, scale, format, fitMode } = body;

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

  try {
    const pdfBuffer = await renderPdf({
      html: html as string | undefined,
      url: url as string | undefined,
      selector: selector as string | undefined,
      scale: scale as number | undefined,
      format: format as string | undefined,
      fitMode: fitMode as 'contain' | 'none' | undefined,
    });

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
    return c.json({ error: message }, 500);
  }
});

export { pdfRoutes };
