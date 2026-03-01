import { I18nProvider } from '@lingui/react';
import { i18n } from './i18n.js';
import { Home } from './pages/Home.js';

export default function App() {
  return (
    <I18nProvider i18n={i18n}>
      <Home />
    </I18nProvider>
  );
}
