import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { timeout } from 'hono/timeout';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { rateLimiter } from 'hono-rate-limiter';
import { pdfRoutes } from './routes/pdf.js';
import { browserService } from './services/browser.js';

const app = new Hono();

// Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
app.use('*', secureHeaders());

// CORS
app.use('*', cors());

// Rate limiting: max PDF-generate requests per minute per IP
app.use(
  '/api/v1/pdf/generate',
  rateLimiter({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT ?? 20),
    standardHeaders: 'draft-6',
    keyGenerator: (c) => {
      const ip =
        c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
        c.req.header('x-real-ip');
      if (!ip) {
        // Reject requests with no identifiable client IP
        throw new Error('Unable to determine client IP');
      }
      return ip;
    },
  }),
);

// Hard per-request timeout (18 s – slightly above the renderer's 15 s)
app.use('/api/v1/pdf/*', timeout(18000));

// Limit raw request body to 11 MB (renderer enforces 10 MB on the HTML string)
app.use(
  '/api/v1/pdf/*',
  bodyLimit({
    maxSize: 11 * 1024 * 1024,
    onError: (c) => c.json({ error: 'Request body too large' }, 413),
  }),
);

// AdSense injection middleware
const adsenseClient = process.env.ADSENSE_CLIENT;
if (adsenseClient) {
  app.use('*', async (c, next) => {
    await next();
    const contentType = c.res.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      const text = await c.res.text();
      const injected = text.replace(
        '</head>',
        `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script></head>`,
      );
      return new Response(injected, {
        status: c.res.status,
        headers: c.res.headers,
      });
    }
  });
}

app.route('/api/v1/pdf', pdfRoutes);

// Serve frontend static files in production
app.use('/*', serveStatic({ root: './public' }));

const port = Number(process.env.PORT ?? 3000);

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`CrispRender server running on http://localhost:${port}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await browserService.close();
  server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
