import { useState, useEffect } from 'react';
import { useLingui } from '@lingui/react';
import { msg } from '@lingui/core/macro';
import { Button } from '@/components/Button.js';
import { Input } from '@/components/Input.js';
import { Select } from '@/components/Select.js';
import { Card } from '@/components/Card.js';
import { HtmlSourceTabs, type HtmlSourceValue } from './HtmlSourceTabs.js';
import { MetaTagPanel } from './MetaTagPanel.js';
import { AdvancedOptions } from './AdvancedOptions.js';
import { MetaHelpDialog } from './MetaHelpDialog.js';
import { extractMetaOptionsFromHtml, type MetaRenderOptions } from '@/utils/metaOptions.js';
import { form, formLayout, formSide, row, resultArea, errorText, successLink } from './RenderForm.css.js';
import { MessageDescriptor } from '@lingui/core';



interface ResultAreaProps {
  pdfUrl: string | null;
  error: string | null;
}

export function ResultArea({ pdfUrl, error }: ResultAreaProps) {
  const { i18n } = useLingui();
  if (!pdfUrl && !error) return null;
  return (
    <div className={resultArea}>
      {error && <p className={errorText}>{error}</p>}
      {pdfUrl && (
        <a className={successLink} href={pdfUrl} download="output.pdf">
          {i18n._(msg`Download PDF`)}
        </a>
      )}
    </div>
  );
}

const FORMAT_OPTIONS = ['', 'None', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'Letter', 'Legal'] as const;
const FITMODE_OPTIONS = ['', 'contain', 'none'] as const;

const FORMAT_LABELS: Record<string, MessageDescriptor> = {
  '': msg`Default`,
  'None': msg`None (Illustration)`,
};

const FITMODE_LABELS: Record<string, MessageDescriptor> = {
  '': msg`Default`,
  'contain': msg`Contain`,
  'none': msg`None`,
};

export function RenderForm() {
  const { i18n } = useLingui();

  const formatOptions = FORMAT_OPTIONS.map((fmt) => ({
    value: fmt,
    label: FORMAT_LABELS[fmt] ? i18n._(FORMAT_LABELS[fmt]) : fmt,
  }));

  const fitModeOptions = FITMODE_OPTIONS.map((fm) => ({
    value: fm,
    label: FITMODE_LABELS[fm] ? i18n._(FITMODE_LABELS[fm]) : fm,
  }));

  const metaPrefix = i18n._(msg`(meta)`);
  const defaultPrefix = i18n._(msg`(default)`);
  const defaultFormat= i18n._(FORMAT_LABELS['None']!);
  const defaultFitMode = i18n._(FITMODE_LABELS['contain']!);

  const [htmlSource, setHtmlSource] = useState<HtmlSourceValue>(null);
  const [selector, setSelector] = useState('');
  const [scale, setScale] = useState('');
  const [format, setFormat] = useState('');
  const [fitMode, setFitMode] = useState('');
  const [advancedValues, setAdvancedValues] = useState({
    viewportWidth: '',
    viewportHeight: '',
    waitAfterLoad: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [detectedMeta, setDetectedMeta] = useState<MetaRenderOptions>({});
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (htmlSource && (htmlSource.type === 'html' || htmlSource.type === 'file')) {
      setDetectedMeta(extractMetaOptionsFromHtml(htmlSource.content));
    } else {
      setDetectedMeta({});
    }
  }, [htmlSource]);

  const generateMetaTags = (): string => {
    const lines: string[] = [];

    const sel = selector.trim() || detectedMeta.selector;
    if (sel) lines.push(`<meta name="crisprender-selector" content="${sel}">`);

    const scaleVal = scale.trim() || (detectedMeta.scale !== undefined ? String(detectedMeta.scale) : '1');
    lines.push(`<meta name="crisprender-scale" content="${scaleVal}">`);

    const fmt = format || detectedMeta.format;
    if (fmt) lines.push(`<meta name="crisprender-format" content="${fmt}">`);

    const fm = fitMode || detectedMeta.fitMode;
    if (fm) lines.push(`<meta name="crisprender-fit-mode" content="${fm}">`);

    const vw = advancedValues.viewportWidth.trim() || (detectedMeta.viewportWidth !== undefined ? String(detectedMeta.viewportWidth) : '1280');
    lines.push(`<meta name="crisprender-viewport-width" content="${vw}">`);

    const vh = advancedValues.viewportHeight.trim() || (detectedMeta.viewportHeight !== undefined ? String(detectedMeta.viewportHeight) : '900');
    lines.push(`<meta name="crisprender-viewport-height" content="${vh}">`);

    const wal = advancedValues.waitAfterLoad.trim() || (detectedMeta.waitAfterLoad !== undefined ? String(detectedMeta.waitAfterLoad) : '0');
    lines.push(`<meta name="crisprender-wait-after-load" content="${wal}">`);

    return lines.join('\n');
  };

  const handleCopyMeta = async () => {
    try {
      await navigator.clipboard.writeText(generateMetaTags());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback ignored
    }
  };

  const handleAdvancedChange = (field: keyof typeof advancedValues, value: string) => {
    setAdvancedValues((prev) => ({ ...prev, [field]: value }));
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
      const scaleNum = parseFloat(scale);
      if (!isNaN(scaleNum) && scale.trim()) body.scale = scaleNum;
      if (format) body.format = format;
      if (fitMode) body.fitMode = fitMode;
      const vw = parseInt(advancedValues.viewportWidth, 10);
      if (!isNaN(vw) && vw > 0) body.viewportWidth = vw;
      const vh = parseInt(advancedValues.viewportHeight, 10);
      if (!isNaN(vh) && vh > 0) body.viewportHeight = vh;
      const wal = parseInt(advancedValues.waitAfterLoad, 10);
      if (!isNaN(wal) && wal >= 0) body.waitAfterLoad = wal;

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
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n._(msg`An error occurred. Please try again.`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <form className={form} onSubmit={handleSubmit}>
          <div className={formLayout}>
            <div>
              <HtmlSourceTabs onChange={setHtmlSource} />
              <MetaTagPanel
                detectedMeta={detectedMeta}
                copied={copied}
                onCopyMeta={handleCopyMeta}
                onHelpClick={() => setShowHelpDialog(true)}
              />
            </div>

            <div className={formSide}>
              <Input
                id="selector"
                label={i18n._(msg`CSS Selector`)}
                placeholder={
                  detectedMeta.selector
                    ? `${detectedMeta.selector} (meta)`
                    : i18n._(msg`#main or .content`)
                }
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
                  placeholder={
                    detectedMeta.scale !== undefined
                      ? `${detectedMeta.scale} ${metaPrefix}`
                      : `1 ${defaultPrefix}`
                  }
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                />
                <Select
                  label={i18n._(msg`Paper Format`)}
                  value={format}
                  onValueChange={setFormat}
                  options={formatOptions}
                  placeholder={
                    detectedMeta.format
                      ? `${detectedMeta.format} ${metaPrefix}`
                      : `${defaultFormat} ${defaultPrefix}`
                  }
                />
              </div>

              <Select
                label={i18n._(msg`Fit Mode`)}
                value={fitMode}
                onValueChange={setFitMode}
                options={fitModeOptions}
                placeholder={
                  detectedMeta.fitMode
                    ? `${detectedMeta.fitMode} ${metaPrefix}`
                    : `${defaultFitMode} ${defaultPrefix}`
                }
              />

              <AdvancedOptions
                show={showAdvanced}
                onToggle={() => setShowAdvanced((v) => !v)}
                detectedMeta={detectedMeta}
                values={advancedValues}
                onChange={handleAdvancedChange}
              />

              <Button type="submit" size="lg" disabled={loading}>
                {loading ? i18n._(msg`Generating...`) : i18n._(msg`Generate PDF`)}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <ResultArea pdfUrl={pdfUrl} error={error} />
      <MetaHelpDialog open={showHelpDialog} onClose={() => setShowHelpDialog(false)} />
    </>
  );
}