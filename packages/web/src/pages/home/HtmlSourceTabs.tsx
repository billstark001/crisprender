import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useLingui } from '@lingui/react';
import { msg } from '@lingui/macro';
import { Textarea } from '@/components/Input.js';
import {
  tabsRoot,
  tabsList,
  tabsTrigger,
  tabsContent,
  fileUpload,
  fileUploadActive,
  fileUploadText,
  fileUploadHint,
  fileUploadName,
} from './HtmlSourceTabs.css.js';
import { Input } from '@/components/Input.js';

export type HtmlSourceValue =
  | { type: 'html'; content: string }
  | { type: 'file'; content: string; fileName: string }
  | { type: 'url'; url: string }
  | null;

export interface HtmlSourceTabsProps {
  onChange: (value: HtmlSourceValue) => void;
}

type TabKey = 'html' | 'file' | 'url';

export function HtmlSourceTabs({ onChange }: HtmlSourceTabsProps) {
  const { i18n } = useLingui();
  const [activeTab, setActiveTab] = useState<TabKey>('html');
  const [htmlContent, setHtmlContent] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const emitChange = (
    tab: TabKey,
    html: string,
    file: string,
    fName: string | null,
    u: string,
  ) => {
    if (tab === 'html') {
      onChange(html.trim() ? { type: 'html', content: html } : null);
    } else if (tab === 'file') {
      onChange(file.trim() && fName ? { type: 'file', content: file, fileName: fName } : null);
    } else {
      onChange(u.trim() ? { type: 'url', url: u } : null);
    }
  };

  const handleTabChange = (tab: string) => {
    const t = tab as TabKey;
    setActiveTab(t);
    emitChange(t, htmlContent, fileContent, fileName, url);
  };

  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    emitChange(activeTab, value, fileContent, fileName, url);
  };

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    const currentTab = activeTab;
    const currentHtml = htmlContent;
    const currentUrl = url;
    reader.onload = (e) => {
      const content = e.target?.result as string ?? '';
      setFileContent(content);
      setFileName(file.name);
      emitChange(currentTab, currentHtml, content, file.name, currentUrl);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    emitChange(activeTab, htmlContent, fileContent, fileName, value);
  };

  return (
    <Tabs.Root className={tabsRoot} defaultValue="html" onValueChange={handleTabChange}>
      <Tabs.List className={tabsList}>
        <Tabs.Trigger className={tabsTrigger} value="html">
          {i18n._(msg`HTML`)}
        </Tabs.Trigger>
        <Tabs.Trigger className={tabsTrigger} value="file">
          {i18n._(msg`File`)}
        </Tabs.Trigger>
        <Tabs.Trigger className={tabsTrigger} value="url">
          {i18n._(msg`URL`)}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content className={tabsContent} value="html">
        <Textarea
          id="html"
          label={i18n._(msg`HTML Content`)}
          placeholder={i18n._(msg`Paste your HTML here...`)}
          value={htmlContent}
          onChange={(e) => handleHtmlChange(e.target.value)}
          rows={8}
        />
      </Tabs.Content>

      <Tabs.Content className={tabsContent} value="file">
        <label
          className={`${fileUpload}${isDragging ? ` ${fileUploadActive}` : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".html,.htm"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {fileName
            ? <span className={fileUploadName}>{fileName}</span>
            : <span className={fileUploadText}>{i18n._(msg`Click or drag an HTML file here`)}</span>
          }
          <span className={fileUploadHint}>{i18n._(msg`Accepts .html, .htm`)}</span>
        </label>
      </Tabs.Content>

      <Tabs.Content className={tabsContent} value="url">
        <Input
          id="url"
          label={i18n._(msg`URL`)}
          placeholder={i18n._(msg`https://example.com`)}
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}
