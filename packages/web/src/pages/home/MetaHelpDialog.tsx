import { useLingui } from '@lingui/react';
import { msg } from '@lingui/core/macro';
import { Dialog } from '@/components/Dialog.js';
import {
  section, sectionTitle, table, th, td, codeBlock, noteText,
} from './MetaHelpDialog.css.js';
import { DialogTitle } from '@radix-ui/react-dialog';

interface MetaHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>
        {i18n._(msg`Using Meta Tags for Configuration`)}
      </DialogTitle>
      {/* --- What it does --- */}
      <div className={section}>
        <p className={sectionTitle}>{i18n._(msg`What are meta tag options?`)}</p>
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
          {i18n._(msg`For each option CrispRender tries every combination of 4 case styles × 4 prefixes (first match wins).`)}
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
          {i18n._(msg`Prefixes in order: crisprender · crisp-render · cr · (none)`)}
        </p>
      </div>

      {/* --- Example --- */}
      <div className={section}>
        <p className={sectionTitle}>{i18n._(msg`Example`)}</p>
        <pre className={codeBlock}>{EXAMPLE_HTML}</pre>
        <p className={noteText}>
          {i18n._(msg`The legacy name "pdf-target-selector" is also accepted as an alias for "selector".`)}
        </p>
      </div>
    </Dialog>
  );
}
