import puppeteer, { Browser, Page } from 'puppeteer';

const BLOCKED_URL_PATTERNS = [
  '.mp4',
  '.mp3',
  'google-analytics.com',
  'googlesyndication.com',
  'doubleclick.net',
];

class BrowserService {
  private browser: Browser | null = null;

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
    let browser: Browser;
    try {
      browser = await this.getBrowser();
    } catch {
      browser = await this.launch();
    }

    const page = await browser.newPage();

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
