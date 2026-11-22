'use client';

import * as React from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './modal';
import { Button } from './button';

export interface ViewGuideField {
  label: string;
  example?: string;
  steps: string[];
}

export interface ViewGuideStep {
  id: string;
  number: string;
  title: string;
  description: string;
  platformLabel?: string;
  platformUrl?: string;
  fields: ViewGuideField[];
}

export interface GuideInfoButtonProps {
  onClick: () => void;
  title?: string;
  active?: boolean;
  className?: string;
}

/**
 * Circular (!) trigger button placed next to section/card titles to open ViewGuideModal.
 */
export function GuideInfoButton({
  onClick,
  title = 'Afficher le guide de cette section',
  active = false,
  className,
}: GuideInfoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-full border transition-all shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30',
        active
          ? 'bg-[#C59B27] text-white border-[#C59B27] shadow-xs'
          : 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6] hover:bg-[#C59B27] hover:text-white hover:border-[#C59B27]',
        className
      )}
    >
      <AlertCircle className="w-3.5 h-3.5" />
    </button>
  );
}

export interface ViewGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  steps: ViewGuideStep[];
  currentIndex: number;
  onStepChange: (index: number) => void;
}

/**
 * Shared interactive guided-tour popup built on the centralized Modal component.
 */
export function ViewGuideModal({
  isOpen,
  onClose,
  title,
  subtitle,
  steps,
  currentIndex,
  onStepChange,
}: ViewGuideModalProps) {
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, steps.length - 1));
  const step = steps[safeIndex];

  if (!step) return null;

  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type="wizard"
      size="2xl"
      icon={
        <div className="w-9 h-9 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#B8860B] flex items-center justify-center shrink-0">
          <Compass className="w-4 h-4" />
        </div>
      }
      title={title}
      subtitle={subtitle}
      bodyClassName="overflow-hidden p-5 sm:p-6"
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFirst}
            onClick={() => onStepChange(safeIndex - 1)}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Précédent
          </Button>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Élément {safeIndex + 1} / {steps.length}
          </span>

          {isLast ? (
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={onClose}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Terminer la visite
            </Button>
          ) : (
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => onStepChange(safeIndex + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Suivant
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Interactive Tour Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-100">
          {steps.map((item, idx) => {
            const selected = idx === safeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onStepChange(idx)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border whitespace-nowrap',
                  selected
                    ? 'bg-[#1D232E] text-[#E6C86E] border-[#1D232E] shadow-xs'
                    : 'bg-[#FBF9F4] text-slate-600 border-[#E6E1D6] hover:border-[#C59B27] hover:text-[#1D232E]'
                )}
              >
                {item.number}
              </button>
            );
          })}
        </div>

        {/* Active Section Header */}
        <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-[#1D232E] text-[#E6C86E] text-[10px] font-black tracking-wider shrink-0">
                {step.number}
              </span>
              <h4 className="text-sm font-black text-[#1D232E] truncate">{step.title}</h4>
            </div>
            <p className="text-xs text-slate-600">{step.description}</p>
          </div>

          {step.platformUrl && step.platformLabel && (
            <a
              href={step.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E6D6A6] text-[11px] font-bold text-[#9A7414] hover:bg-[#FBF6E8] transition shrink-0 whitespace-nowrap"
            >
              <span>{step.platformLabel}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Field Instructions */}
        <div
          className={cn(
            step.fields.length >= 3
              ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5'
              : 'space-y-2.5'
          )}
        >
          {step.fields.map((field) => (
            <div
              key={field.label}
              className="p-3 rounded-2xl bg-white border border-slate-200/90 space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-[#1D232E]">{field.label}</span>
                {field.example && (
                  <code className="px-2 py-0.5 rounded-md bg-[#F8F9FA] border border-slate-200 text-[10px] font-mono text-slate-700">
                    {field.example}
                  </code>
                )}
              </div>
              <ol className="space-y-0.5 pl-4 list-decimal text-[11px] text-slate-600 leading-relaxed">
                {field.steps.map((line, lineIdx) => (
                  <li key={lineIdx}>{line}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
