import puppeteer, { Browser, Page } from 'puppeteer';

const BLOCKED_URL_PATTERNS = [
  '.mp4',
  '.mp3',
  'google-analytics.com',
  'googlesyndication.com',
  'doubleclick.net',
];

/** Maximum number of Puppeteer pages open concurrently. */
export const MAX_CONCURRENT_PAGES = Number(process.env.MAX_CONCURRENT_PAGES ?? 5);

class BrowserService {
  private browser: Browser | null = null;
  /** Tracks open pages to enforce the concurrency cap. */
  private readonly openPages = new Set<Page>();

  private async launch(): Promise<Browser> {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      ...(executablePath ? { executablePath } : {}),
    });

    this.browser.on('disconnected', () => {
      this.browser = null;
    });

    return this.browser;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      return this.launch();
    }
    return this.browser;
  }

  async getPage(): Promise<Page> {
    if (this.openPages.size >= MAX_CONCURRENT_PAGES) {
      throw new Error('Server busy: too many concurrent rendering requests');
    }

    let browser: Browser;
    try {
      browser = await this.getBrowser();
    } catch {
      browser = await this.launch();
    }

    const page = await browser.newPage();
    this.openPages.add(page);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      const isBlocked = BLOCKED_URL_PATTERNS.some((pattern) =>
        url.includes(pattern),
      );
      if (isBlocked) {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }

  async releasePage(page: Page): Promise<void> {
    if (!this.openPages.has(page)) return; // guard against double-release
    this.openPages.delete(page);
    await page.close();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const browserService = new BrowserService();
