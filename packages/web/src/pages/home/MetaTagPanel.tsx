import { useLingui } from '@lingui/react';
import { msg } from '@lingui/core/macro';
import { type MetaRenderOptions } from '@/utils/metaOptions.js';
import {
  metaHintBox, metaHintHeader, metaHintTitle, metaHintList, metaHintItem,
  metaHintEmpty, metaHintFooter, metaHintNote, questionBtn, copyMetaBtn,
} from './MetaTagPanel.css.js';

interface MetaTagPanelProps {
  detectedMeta: MetaRenderOptions;
  copied: boolean;
  onCopyMeta: () => void;
  onHelpClick: () => void;
}

export function MetaTagPanel({ detectedMeta, copied, onCopyMeta, onHelpClick }: MetaTagPanelProps) {
  const { i18n } = useLingui();
  return (
    <div className={metaHintBox}>
      <div className={metaHintHeader}>
        <p className={metaHintTitle}>{i18n._(msg`Meta tag options`)}</p>
        <button
          type="button"
          className={questionBtn}
          onClick={onHelpClick}
          title={i18n._(msg`Learn how to use meta tags`)}
          aria-label={i18n._(msg`Learn how to use meta tags`)}
        >?</button>
      </div>
      {Object.keys(detectedMeta).length > 0 ? (
        <ul className={metaHintList}>
          {detectedMeta.selector !== undefined && (
            <li className={metaHintItem}><strong>selector</strong>: {detectedMeta.selector}</li>
          )}
          {detectedMeta.scale !== undefined && (
            <li className={metaHintItem}><strong>scale</strong>: {detectedMeta.scale}</li>
          )}
          {detectedMeta.format !== undefined && (
            <li className={metaHintItem}><strong>format</strong>: {detectedMeta.format}</li>
          )}
          {detectedMeta.fitMode !== undefined && (
            <li className={metaHintItem}><strong>fitMode</strong>: {detectedMeta.fitMode}</li>
          )}
          {detectedMeta.viewportWidth !== undefined && (
            <li className={metaHintItem}><strong>viewportWidth</strong>: {detectedMeta.viewportWidth}</li>
          )}
          {detectedMeta.viewportHeight !== undefined && (
            <li className={metaHintItem}><strong>viewportHeight</strong>: {detectedMeta.viewportHeight}</li>
          )}
          {detectedMeta.waitAfterLoad !== undefined && (
            <li className={metaHintItem}><strong>waitAfterLoad</strong>: {detectedMeta.waitAfterLoad}ms</li>
          )}
        </ul>
      ) : (
        <p className={metaHintEmpty}>{i18n._(msg`No meta tags detected in this HTML`)}</p>
      )}
      <div className={metaHintFooter}>
        <span className={metaHintNote}>{i18n._(msg`Form values override meta tags`)}</span>
        <button type="button" className={copyMetaBtn} onClick={onCopyMeta}>
          {copied ? i18n._(msg`Copied!`) : i18n._(msg`Copy meta tags`)}
        </button>
      </div>
    </div>
  );
}