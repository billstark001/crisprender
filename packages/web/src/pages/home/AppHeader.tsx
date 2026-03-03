import { locales, type Locale } from '@/i18n.js';
import { header, logo, langSelector, langBtn, langBtnActive } from './AppHeader.css.js';

interface AppHeaderProps {
  currentLocale: Locale;
  onLocaleSwitch: (locale: Locale) => void;
}

export function AppHeader({ currentLocale, onLocaleSwitch }: AppHeaderProps) {
  return (
    <header className={header}>
      <span className={logo}>CrispRender</span>
      <div className={langSelector}>
        {(Object.keys(locales) as Locale[]).map((locale) => (
          <button
            key={locale}
            className={locale === currentLocale ? langBtnActive : langBtn}
            onClick={() => onLocaleSwitch(locale)}
          >
            {locales[locale]}
          </button>
        ))}
      </div>
    </header>
  );
}