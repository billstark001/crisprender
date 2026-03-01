import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { pdfRoutes } from './routes/pdf.js';
import { browserService } from './services/browser.js';

const app = new Hono();

app.use('*', cors());

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
