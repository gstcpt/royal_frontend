'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiAssistant } from '@/providers/AiAssistantProvider';

interface SectionAiRecapData {
  headline?: string;
  executiveSummary?: string;
  highlights?: Array<{ label: string; insight: string }>;
  risks?: string[];
  recommendations?: Array<{ title: string; priority?: string; action: string }>;
}

export function SectionAiRecapPanel({
  sectionId,
  title,
  subtitle,
  kpis,
  summaryMetrics,
}: {
  sectionId: string;
  title: string;
  subtitle?: string;
  kpis?: Record<string, any>;
  summaryMetrics?: Record<string, any>;
}) {
  const { isRecapEnabled, runAiJob } = useAiAssistant();
  const [recap, setRecap] = useState<SectionAiRecapData | null>(null);
  const [metaInfo, setMetaInfo] = useState<{ provider?: string; model?: string; workerNumber?: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRecap(null);
    setMetaInfo(null);
  }, [sectionId]);

  if (!isRecapEnabled(sectionId)) {
    return null;
  }

  const handleGenerateRecap = async () => {
    setBusy(true);
    try {
      const res: any = await runAiJob({
        mode: 'SECTION_RECAP',
        title: `Récapitulatif IA — ${title}`,
        subtitle: 'Analyse de la vue d’ensemble avec failover multi-workers',
        payload: {
          sectionId,
          title,
          subtitle,
          kpis: kpis || {},
          summaryMetrics: summaryMetrics || {},
        },
      });
      if (res) {
        setRecap(res.data || res);
        setMetaInfo({
          provider: res.provider,
          model: res.model,
          workerNumber: res.workerNumber,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6D6A6] shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-heading font-black text-[#1D232E]">
                Synthèse &amp; Recommandations IA
              </h2>
              {metaInfo?.provider && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Worker {metaInfo.workerNumber || 1} · {metaInfo.provider} ({metaInfo.model})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Obtenez un récapitulatif analytique instantané des indicateurs et priorités d&apos;action de cette section.
            </p>
          </div>
        </div>

        <Button variant="gold" size="sm" onClick={handleGenerateRecap} isLoading={busy}>
          {recap ? <RefreshCw className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
          <span>{recap ? 'Actualiser le Récap IA' : 'Générer Récap IA'}</span>
        </Button>
      </div>

      {recap && (
        <div className="pt-4 border-t border-[#E6E1D6] space-y-4">
          {recap.headline && (
            <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6]">
              <div className="text-sm font-heading font-black text-[#9A7414]">{recap.headline}</div>
              {recap.executiveSummary && (
                <p className="text-xs text-[#1D232E] leading-relaxed mt-1.5">{recap.executiveSummary}</p>
              )}
            </div>
          )}

          {Array.isArray(recap.highlights) && recap.highlights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {recap.highlights.map((h, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-neutral-200 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-[#9A7414]">{h.label}</div>
                  <p className="text-xs text-[#1D232E] leading-relaxed">{h.insight}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.isArray(recap.recommendations) && recap.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Plan d&apos;Action Prioritaire</span>
                </div>
                <div className="space-y-2">
                  {recap.recommendations.map((r, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 text-xs">
                      <div className="flex items-center justify-between gap-2 font-bold text-[#1D232E]">
                        <span>{r.title}</span>
                        {r.priority && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700">
                            {r.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1">{r.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(recap.risks) && recap.risks.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Points de Vigilance</span>
                </div>
                <div className="space-y-2">
                  {recap.risks.map((risk, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs text-[#1D232E]">
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
