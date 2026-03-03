import { useState } from 'react';
import { loadCatalog, type Locale } from '@/i18n.js';
import { useLingui } from '@lingui/react';
import { msg } from '@lingui/core/macro';
import { AppHeader } from './AppHeader.js';
import { RenderForm } from './RenderForm.js';
import { page, main, adsenseArea, hero, heroTitle, heroSubtitle, footer } from './Home.css.js';

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

export function HeroSection() {
  const { i18n } = useLingui();
  return (
    <div className={hero}>
      <h1 className={heroTitle}>{i18n._(msg`CrispRender`)}</h1>
      <p className={heroSubtitle}>{i18n._(msg`Vector-perfect PDF rendering from HTML`)}</p>
    </div>
  );
}

export function AppFooter() {
  const { i18n } = useLingui();
  return (
    <footer className={footer}>
      {i18n._(msg`Powered by Chromium & Hono`)}
    </footer>
  );
}

export function Home() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');

  const switchLocale = async (locale: Locale) => {
    await loadCatalog(locale);
    setCurrentLocale(locale);
  };

  return (
    <div className={page}>
      <AppHeader currentLocale={currentLocale} onLocaleSwitch={switchLocale} />
      <main className={main}>
        <HeroSection />
        {adsenseClient && (
          <div className={adsenseArea}>Advertisement</div>
        )}
        <RenderForm />
      </main>
      <AppFooter />
    </div>
  );
}