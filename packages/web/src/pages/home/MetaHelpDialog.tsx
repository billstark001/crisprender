import { useState } from 'react';
import { useLingui } from '@lingui/react';
import { msg } from '@lingui/core/macro';
import { Dialog } from '@/components/Dialog.js';
import { Button } from '@/components/Button.js';
import {
  section, sectionTitle, table, th, td, codeBlock, noteText,
  copyPromptRow, copyPromptNote,
} from './MetaHelpDialog.css.js';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Trans } from '@lingui/react/macro';

interface MetaHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const AI_PROMPT = `When generating or modifying HTML for CrispRender (a Vector-perfect PDF rendering from HTML), embed render settings as <meta> tags inside the <head> element. Available options:

  crisprender-selector        CSS selector for the element to capture (e.g. "#chart"). Omit to capture <body>.
  crisprender-scale           Scale factor (number, default 1).
  crisprender-format          Paper format: A0 | A1 | A2 | A3 | A4 | A5 | Letter | Legal. Omit for illustration mode.
  crisprender-fit-mode        How to fit the element on paper: contain | none (default contain).
  crisprender-viewport-width  Headless browser viewport width in px (default 1280).
  crisprender-viewport-height Headless browser viewport height in px (default 900).
  crisprender-wait-after-load Extra milliseconds to wait after networkidle0 before rendering (default 0).

Names are flexible: each option is resolved by trying kebab-case / snake_case / camelCase / PascalCase variants with prefixes crisprender-, crisp-render-, cr-, and no prefix (first match wins). For example, crisprender-fit-mode, cr-fitMode, and fitMode all work for the fitMode option.

Example head section:
<meta name="crisprender-selector"        content="#chart">
<meta name="crisprender-scale"           content="2">
<meta name="crisprender-format"          content="A4">
<meta name="crisprender-fit-mode"        content="contain">
<meta name="crisprender-viewport-width"  content="1920">
<meta name="crisprender-viewport-height" content="1080">
<meta name="crisprender-wait-after-load" content="500">

These values act as defaults and are overridden by options explicitly supplied in the API request body.`;

const EXAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="crisprender-selector"        content="#chart">
  <meta name="crisprender-scale"           content="2">
  <meta name="crisprender-format"          content="A4">
  <meta name="crisprender-fit-mode"        content="contain">
  <meta name="crisprender-viewport-width"  content="1920">
  <meta name="crisprender-viewport-height" content="1080">
  <meta name="crisprender-wait-after-load" content="500">
</head>
<body>
  <div id="chart"><!-- your content --></div>
</body>
</html>`;

/**
 * Dialog explaining how to embed CrispRender options via <meta> tags.
 */
export function MetaHelpDialog({ open, onClose }: MetaHelpDialogProps) {
  const { i18n } = useLingui();
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>
        <Trans>Using Meta Tags for Configuration</Trans>
      </DialogTitle>
      {/* --- What it does --- */}
      <div className={section}>
        <p className={sectionTitle}><Trans>What are meta tag options?</Trans></p>
        <p>
          {i18n._(msg`You can embed CrispRender render settings directly inside the HTML document using <meta> tags. These values act as defaults and are overridden by any option you set in the form.`)}
        </p>
      </div>

      {/* --- Available options --- */}
      <div className={section}>
        <p className={sectionTitle}>{i18n._(msg`Available options`)}</p>
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>{i18n._(msg`Option`)}</th>
              <th className={th}>{i18n._(msg`Type`)}</th>
              <th className={th}>{i18n._(msg`Default`)}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'selector', type: 'string', def: '— (body)' },
              { name: 'scale', type: 'number', def: '1' },
              { name: 'format', type: 'A0–A5 | Letter | …', def: '— (illustration)' },
              { name: 'fitMode', type: 'contain | none', def: 'contain' },
              { name: 'viewportWidth', type: 'number (px)', def: '1280' },
              { name: 'viewportHeight', type: 'number (px)', def: '900' },
              { name: 'waitAfterLoad', type: 'number (ms)', def: '0' },
            ].map(({ name, type, def }) => (
              <tr key={name}>
                <td className={td}>{name}</td>
                <td className={td}>{type}</td>
                <td className={td}>{def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Naming convention --- */}
      <div className={section}>
        <p className={sectionTitle}>{i18n._(msg`Naming convention`)}</p>
        <p>
          <Trans>For each option CrispRender tries every combination of 4 case styles × 4 prefixes (first match wins).</Trans>
        </p>
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>{i18n._(msg`Style`)}</th>
              <th className={th}>{i18n._(msg`fitMode example`)}</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['kebab-case', 'crisprender-fit-mode  / cr-fit-mode  / fit-mode'],
              ['snake_case', 'crisprender-fit_mode  / cr-fit_mode  / fit_mode'],
              ['camelCase', 'crisprender-fitMode   / cr-fitMode   / fitMode'],
              ['PascalCase', 'crisprender-FitMode   / cr-FitMode   / FitMode'],
            ].map(([style, example]) => (
              <tr key={style}>
                <td className={td}>{style}</td>
                <td className={td}>{example}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={noteText}>
          <Trans>Prefixes in order: crisprender · crisp-render · cr · (none)</Trans>
        </p>
      </div>

      {/* --- Example --- */}
      <div className={section}>
        <p className={sectionTitle}>{i18n._(msg`Example`)}</p>
        <pre className={codeBlock}>{EXAMPLE_HTML}</pre>
        <p className={noteText}>
          <Trans>The legacy name "pdf-target-selector" is also accepted as an alias for "selector".</Trans>
        </p>
      </div>

      {/* --- AI prompt copy --- */}
      <div className={copyPromptRow}>
        <span className={copyPromptNote}>
          <Trans>Copy a ready-made prompt for AI assistants describing how to embed CrispRender meta tags.</Trans>
        </span>
        <Button variant="secondary" size="sm" onClick={handleCopyPrompt}>
          {copied ? i18n._(msg`Copied!`) : i18n._(msg`Copy AI Prompt`)}
        </Button>
      </div>
    </Dialog>
  );
}
