import { useLingui } from '@lingui/react';
import { msg } from '@lingui/core/macro';
import { Input } from '@/components/Input.js';
import { type MetaRenderOptions } from '@/utils/metaOptions.js';
import { advancedToggle, advancedSection, row, checkboxRow } from './AdvancedOptions.css.js';

interface AdvancedOptionsValues {
  viewportWidth: string;
  viewportHeight: string;
  waitAfterLoad: string;
  pruneInvisible: string;
}

interface AdvancedOptionsProps {
  show: boolean;
  onToggle: () => void;
  detectedMeta: MetaRenderOptions;
  values: AdvancedOptionsValues;
  onChange: (field: keyof AdvancedOptionsValues, value: string) => void;
}

export function AdvancedOptions({ show, onToggle, detectedMeta, values, onChange }: AdvancedOptionsProps) {
  const { i18n } = useLingui();

  const metaPrefix = i18n._(msg`(meta)`);
  const defaultPrefix = i18n._(msg`(default)`);

  return (
    <>
      <button type="button" className={advancedToggle} onClick={onToggle}>
        {show ? i18n._(msg`Hide advanced options ▲`) : i18n._(msg`Show advanced options ▼`)}
      </button>
      {show && (
        <div className={advancedSection}>
          <div className={row}>
            <Input
              id="viewportWidth"
              label={i18n._(msg`Viewport Width (px)`)}
              type="number"
              min="1"
              step="1"
              placeholder={
                detectedMeta.viewportWidth !== undefined
                  ? `${detectedMeta.viewportWidth} ${metaPrefix}`
                  : `1280 ${defaultPrefix}`
              }
              value={values.viewportWidth}
              onChange={(e) => onChange('viewportWidth', e.target.value)}
            />
            <Input
              id="viewportHeight"
              label={i18n._(msg`Viewport Height (px)`)}
              type="number"
              min="1"
              step="1"
              placeholder={
                detectedMeta.viewportHeight !== undefined
                  ? `${detectedMeta.viewportHeight} ${metaPrefix}`
                  : `900 ${defaultPrefix}`
              }
              value={values.viewportHeight}
              onChange={(e) => onChange('viewportHeight', e.target.value)}
            />
          </div>
          <Input
            id="waitAfterLoad"
            label={i18n._(msg`Wait After Load (ms)`)}
            type="number"
            min="0"
            step="100"
            placeholder={
              detectedMeta.waitAfterLoad !== undefined
                ? `${detectedMeta.waitAfterLoad} ${metaPrefix}`
                : `0 ${defaultPrefix}`
            }
            value={values.waitAfterLoad}
            onChange={(e) => onChange('waitAfterLoad', e.target.value)}
          />
          <label className={checkboxRow}>
            <input
              type="checkbox"
              id="pruneInvisible"
              checked={values.pruneInvisible === 'true' || (values.pruneInvisible === '' && detectedMeta.pruneInvisible === true)}
              onChange={(e) => onChange('pruneInvisible', e.target.checked ? 'true' : 'false')}
            />
            <span>
              {i18n._(msg`Prune invisible content`)}
              {detectedMeta.pruneInvisible !== undefined && values.pruneInvisible === '' && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>{metaPrefix}</span>
              )}
            </span>
          </label>
        </div>
      )}
    </>
  );
}