import { useState } from 'react';
import { useLingui } from '@lingui/react';
import { msg } from '@lingui/core/macro';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { Select } from '../components/Select.js';
import { Card } from '../components/Card.js';
import { HtmlSourceTabs, type HtmlSourceValue } from '../components/HtmlSourceTabs.js';
import {
  page, header, logo, main, hero, heroTitle, heroSubtitle,
  form, formLayout, formSide, row, resultArea, errorText, successLink,
  footer, adsenseArea, langSelector, langBtn, langBtnActive,
} from './Home.css.js';
import { loadCatalog, locales, type Locale } from '../i18n.js';

const FORMAT_OPTIONS = [
  { value: '', label: 'None (Illustration)' },
  { value: 'A0', label: 'A0' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'A3', label: 'A3' },
  { value: 'A4', label: 'A4' },
  { value: 'A5', label: 'A5' },
  { value: 'Letter', label: 'Letter' },
];

const FITMODE_OPTIONS = [
  { value: 'contain', label: 'Contain' },
  { value: 'none', label: 'None' },
];

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

export function Home() {
  const { i18n } = useLingui();
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');

  const [htmlSource, setHtmlSource] = useState<HtmlSourceValue>(null);
  const [selector, setSelector] = useState('');
  const [scale, setScale] = useState('1');
  const [format, setFormat] = useState('');
  const [fitMode, setFitMode] = useState('contain');
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const switchLocale = async (locale: Locale) => {
    await loadCatalog(locale);
    setCurrentLocale(locale);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      const body: Record<string, unknown> = {};
      if (!htmlSource) {
        setError('Please provide HTML content or a URL.');
        setLoading(false);
        return;
      }
      if (htmlSource.type === 'html' || htmlSource.type === 'file') {
        body.html = htmlSource.content;
      } else {
        body.url = htmlSource.url;
      }
      if (selector.trim()) body.selector = selector;
      body.scale = parseFloat(scale) || 1;
      if (format) body.format = format;
      body.fitMode = fitMode;

      const res = await fetch('/api/v1/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n._(msg`An error occurred. Please try again.`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={page}>
      <header className={header}>
        <span className={logo}>CrispRender</span>
        <div className={langSelector}>
          {(Object.keys(locales) as Locale[]).map((locale) => (
            <button
              key={locale}
              className={locale === currentLocale ? langBtnActive : langBtn}
              onClick={() => switchLocale(locale)}
            >
              {locales[locale]}
            </button>
          ))}
        </div>
      </header>

      <main className={main}>
        <div className={hero}>
          <h1 className={heroTitle}>{i18n._(msg`CrispRender`)}</h1>
          <p className={heroSubtitle}>{i18n._(msg`Vector-perfect PDF rendering from HTML`)}</p>
        </div>

        {adsenseClient && (
          <div className={adsenseArea}>Advertisement</div>
        )}

        <Card>
          <form className={form} onSubmit={handleSubmit}>
            <div className={formLayout}>
              {/* Left / top: HTML source selector */}
              <HtmlSourceTabs onChange={setHtmlSource} />

              {/* Right / bottom: options and submit */}
              <div className={formSide}>
                <Input
                  id="selector"
                  label={i18n._(msg`CSS Selector`)}
                  placeholder={i18n._(msg`#main or .content`)}
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                />

                <div className={row}>
                  <Input
                    id="scale"
                    label={i18n._(msg`Scale`)}
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                  />
                  <Select
                    label={i18n._(msg`Paper Format`)}
                    value={format}
                    onValueChange={setFormat}
                    options={FORMAT_OPTIONS}
                    placeholder={i18n._(msg`None (Illustration)`)}
                  />
                </div>

                <Select
                  label={i18n._(msg`Fit Mode`)}
                  value={fitMode}
                  onValueChange={setFitMode}
                  options={FITMODE_OPTIONS}
                />

                <Button type="submit" size="lg" disabled={loading}>
                  {loading ? i18n._(msg`Generating...`) : i18n._(msg`Generate PDF`)}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {(pdfUrl || error) && (
          <div className={resultArea}>
            {error && <p className={errorText}>{error}</p>}
            {pdfUrl && (
              <a className={successLink} href={pdfUrl} download="output.pdf">
                {i18n._(msg`Download PDF`)}
              </a>
            )}
          </div>
        )}
      </main>

      <footer className={footer}>
        {i18n._(msg`Powered by Chromium & Hono`)}
      </footer>
    </div>
  );
}
