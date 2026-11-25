'use client';

import * as React from 'react';
import { Eye, Sparkles, Languages, FileCode, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export type EmailComposerLocale = 'FR' | 'AR';

export interface EmailTemplateOption {
  id: string;
  key: string;
  category: 'auth' | 'campaign' | 'messages' | 'orders';
  name: string;
  subject: string;
  subjectAr?: string | null;
  bodyHtml: string;
  bodyHtmlAr?: string | null;
  variables?: string[];
  isActive: boolean;
}

interface EmailTemplateComposerProps {
  category: 'campaign' | 'messages' | 'orders' | 'auth';
  locale: EmailComposerLocale;
  onLocaleChange: (next: EmailComposerLocale) => void;
  selectedTemplateId: string;
  onTemplateChange: (tpl: EmailTemplateOption | null) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  bodyText: string;
  onBodyTextChange: (value: string) => void;
  subjectLabel?: string;
  subjectPlaceholder?: string;
  bodyLabel?: string;
  bodyPlaceholder?: string;
  bodyRows?: number;
  previewVariables?: Record<string, string>;
  recipientSummary?: string;
  compact?: boolean;
  hideBodyEditor?: boolean;
}

export function EmailTemplateComposer({
  category,
  locale,
  onLocaleChange,
  selectedTemplateId,
  onTemplateChange,
  subject,
  onSubjectChange,
  bodyText,
  onBodyTextChange,
  subjectLabel,
  subjectPlaceholder,
  bodyLabel,
  bodyPlaceholder,
  bodyRows = 5,
  previewVariables = {},
  recipientSummary,
  compact = false,
  hideBodyEditor = false,
}: EmailTemplateComposerProps) {
  const [templates, setTemplates] = React.useState<EmailTemplateOption[]>([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(true);
  const [compiledPreview, setCompiledPreview] = React.useState<{ subject: string; htmlBody: string } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const selectedTemplate = React.useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId],
  );

  React.useEffect(() => {
    let active = true;
    setLoadingTemplates(true);
    fetchApi('/storefront-cms/cms/email-templates')
      .then((res) => {
        if (!active) return;
        const list: EmailTemplateOption[] = Array.isArray(res) ? res : [];
        const filtered = list.filter((t) => t.category === category && t.isActive !== false);
        setTemplates(filtered);
        if (filtered.length > 0 && !selectedTemplateId) {
          onTemplateChange(filtered[0]);
        }
      })
      .catch(() => {
        if (active) setTemplates([]);
      })
      .finally(() => {
        if (active) setLoadingTemplates(false);
      });
    return () => {
      active = false;
    };
  }, [category]);

  const varsKey = JSON.stringify(previewVariables);

  React.useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetchApi('/storefront-cms/cms/email-templates/preview', {
          method: 'POST',
          body: JSON.stringify({
            templateId: selectedTemplate?.id,
            locale,
            customSubject: subject.trim() || undefined,
            customBodyHtml: category === 'campaign' && bodyText.trim() ? bodyText : undefined,
            variables: {
              ...previewVariables,
              replyBody: bodyText,
              messageBody: bodyText,
              customNote: bodyText,
            },
          }),
        });
        if (!cancelled && res?.htmlBody) {
          setCompiledPreview({ subject: res.subject || subject, htmlBody: res.htmlBody });
        }
      } catch {
        // fallback stays below
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 260);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedTemplate?.id, locale, subject, bodyText, category, varsKey]);

  const handlePickTemplate = (tpl: EmailTemplateOption, nextLocale: EmailComposerLocale = locale) => {
    onTemplateChange(tpl);
    const nextSub = nextLocale === 'AR' ? tpl.subjectAr || tpl.subject : tpl.subject;
    onSubjectChange(nextSub);
    if (category === 'campaign') {
      const nextBody = nextLocale === 'AR' ? tpl.bodyHtmlAr || tpl.bodyHtml : tpl.bodyHtml;
      onBodyTextChange(nextBody);
    }
  };

  const handleSwitchLocale = (nextLocale: EmailComposerLocale) => {
    onLocaleChange(nextLocale);
    if (selectedTemplate) {
      const nextSub = nextLocale === 'AR' ? selectedTemplate.subjectAr || selectedTemplate.subject : selectedTemplate.subject;
      onSubjectChange(nextSub);
      if (category === 'campaign') {
        const nextBody =
          nextLocale === 'AR' ? selectedTemplate.bodyHtmlAr || selectedTemplate.bodyHtml : selectedTemplate.bodyHtml;
        onBodyTextChange(nextBody);
      }
    }
  };

  const defaultBodyLabel =
    locale === 'AR'
      ? 'نص الرسالة الديناميكي (عربي)'
      : category === 'orders'
      ? 'Note personnalisée intégrée à l’e-mail (Optionnel)'
      : 'Message dynamique *';

  return (
    <div className={cn('space-y-4 text-xs', compact ? '' : 'bg-[#FBF9F4]/60 p-4 rounded-2xl border border-[#E6E1D6]')}>
      {/* Top Toolbar: Language FR (Default) / AR (RTL) + Template Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-[#C59B27]" />
          <span className="font-bold uppercase tracking-wider text-[10px] text-[#1D232E]">
            Langue de l&apos;e-mail :
          </span>
          <div className="inline-flex rounded-xl bg-white border border-[#E6E1D6] p-0.5">
            {(['FR', 'AR'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleSwitchLocale(lang)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer',
                  locale === lang
                    ? 'bg-[#C59B27] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-[#FBF6E8]',
                )}
              >
                {lang === 'FR' ? 'FR (Défaut)' : 'AR (عربي RTL)'}
              </button>
            ))}
          </div>
        </div>

        {templates.length > 0 && (
          <div className="flex items-center gap-2 min-w-0">
            <FileCode className="w-3.5 h-3.5 text-[#9A7414] shrink-0" />
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) handlePickTemplate(found, locale);
              }}
              aria-label="Modèle HTML Royal"
              className="h-8 max-w-[260px] rounded-xl border border-[#E6D6A6] bg-white px-2.5 text-[11px] font-bold text-[#1D232E] cursor-pointer focus:outline-none focus:border-[#C59B27]"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <button
                type="button"
                title="Recharger l'objet et le texte depuis ce modèle"
                onClick={() => handlePickTemplate(selectedTemplate, locale)}
                className="p-1.5 rounded-lg border border-[#E6E1D6] bg-white hover:bg-[#FBF6E8] text-[#9A7414] cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick clickable template pills when <= 4 templates */}
      {!loadingTemplates && templates.length > 1 && templates.length <= 4 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {templates.map((tpl) => {
            const isActive = selectedTemplate?.id === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handlePickTemplate(tpl, locale)}
                className={cn(
                  'p-2.5 text-left rounded-xl border transition cursor-pointer',
                  isActive
                    ? 'bg-[#FBF6E8] border-[#C59B27] shadow-2xs'
                    : 'bg-white border-[#E6E1D6] hover:border-[#C59B27]/60',
                )}
              >
                <div className="font-bold text-[11px] text-[#1D232E] flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3 h-3 text-[#C59B27] shrink-0" />
                  <span className="truncate">{tpl.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {locale === 'AR' ? tpl.subjectAr || tpl.subject : tpl.subject}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Subject */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {subjectLabel || (locale === 'AR' ? 'موضوع الرسالة (Objet)' : 'Objet du Courriel')}
        </label>
        <input
          type="text"
          dir={locale === 'AR' ? 'rtl' : 'ltr'}
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder={subjectPlaceholder || (locale === 'AR' ? 'أدخل موضوع الرسالة...' : 'Objet personnalisé (laisser ou adapter du modèle)')}
          className="w-full h-9 px-3 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] focus:outline-none focus:border-[#C59B27]"
        />
      </div>

      {/* Dynamic Body */}
      {!hideBodyEditor && (
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {bodyLabel || defaultBodyLabel}
          </label>
          <textarea
            rows={bodyRows}
            dir={locale === 'AR' ? 'rtl' : 'ltr'}
            value={bodyText}
            onChange={(e) => onBodyTextChange(e.target.value)}
            placeholder={
              bodyPlaceholder ||
              (locale === 'AR'
                ? 'اكتب نص الرسالة هنا ليتم إدماجه داخل القالب الفاخر...'
                : 'Saisissez le message dynamique inséré dans le gabarit Light Luxury...')
            }
            className="w-full p-3 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] leading-relaxed focus:outline-none focus:border-[#C59B27]"
          />
        </div>
      )}

      {/* Real-Time Server-Compiled Light Luxury Preview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Aperçu HTML Light Luxury ({locale})</span>
          </span>
          <span className="text-[10px] text-slate-400">
            {previewLoading ? 'Compilation...' : recipientSummary || (selectedTemplate?.key || '')}
          </span>
        </div>

        <div className="rounded-2xl border border-[#E6E1D6] bg-[#F7F5EE] overflow-hidden">
          {compiledPreview?.subject && (
            <div
              dir={locale === 'AR' ? 'rtl' : 'ltr'}
              className="px-3.5 py-2 bg-white border-b border-[#E6E1D6] text-[11px] font-bold text-[#1D232E] truncate"
            >
              <span className="text-[#9A7414] mr-1">{locale === 'AR' ? 'الموضوع:' : 'Objet :'}</span>
              {compiledPreview.subject}
            </div>
          )}
          <div className="max-h-[260px] overflow-y-auto p-2">
            {compiledPreview?.htmlBody ? (
              <div dangerouslySetInnerHTML={{ __html: compiledPreview.htmlBody }} />
            ) : (
              <div className="p-4 bg-white rounded-xl border border-[#E6E1D6] text-xs text-slate-600">
                {bodyText || 'Prévisualisation du modèle...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
