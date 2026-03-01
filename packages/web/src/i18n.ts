import { i18n } from '@lingui/core';

export const locales = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
} as const;

export type Locale = keyof typeof locales;

export async function loadCatalog(locale: Locale) {
  const { messages } = await import(`./locales/${locale}.po`);
  i18n.loadAndActivate({ locale, messages });
}

export function detectLocale(): Locale {
  const lang = navigator.language.split('-')[0];
  if (lang === 'zh') return 'zh';
  if (lang === 'ja') return 'ja';
  return 'en';
}

export { i18n };
