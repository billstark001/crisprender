import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css.js';
import { i18n } from './i18n.js';
import { loadCatalog, detectLocale } from './i18n.js';
import App from './App.js';

async function bootstrap() {
  const locale = detectLocale();
  await loadCatalog(locale);
  i18n.activate(locale);

  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
