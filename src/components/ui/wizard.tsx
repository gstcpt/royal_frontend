'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from './button';

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  isOptional?: boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  canNext?: boolean;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  errorMessage?: string | null;
}

export function Wizard({
  steps,
  currentStepIndex,
  onStepChange,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting = false,
  canNext = true,
  children,
  submitLabel = 'Enregistrer & Finaliser',
  className,
  errorMessage,
}: WizardProps) {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStep = steps[currentStepIndex];

  return (
    <div className={cn('flex flex-col h-full space-y-6', className)}>
      {/* Step Navigation Pill Bar */}
      <div className="border-b border-neutral-100 pb-5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => {
                    // Allow navigating back or forward if allowed
                    if (idx <= currentStepIndex) {
                      onStepChange(idx);
                    }
                  }}
                  disabled={idx > currentStepIndex}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none',
                    isCurrent && 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-sm',
                    isCompleted && 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer',
                    !isCurrent && !isCompleted && 'bg-neutral-100 text-neutral-400 opacity-60 cursor-not-allowed'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                      isCurrent && 'bg-white text-[#9A7414]',
                      isCompleted && 'bg-emerald-600 text-white',
                      !isCurrent && !isCompleted && 'bg-neutral-200 text-neutral-500'
                    )}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </span>
                  <span>{step.title}</span>
                </button>

                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-6 rounded-full shrink-0',
                      idx < currentStepIndex ? 'bg-emerald-500' : 'bg-neutral-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Step Header */}
        <div className="mt-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Étape {currentStepIndex + 1} sur {steps.length}
          </span>
          <h4 className="font-heading font-black text-lg text-neutral-900 tracking-tight">
            {currentStep?.title}
          </h4>
          {currentStep?.subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5">{currentStep.subtitle}</p>
          )}
        </div>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Footer Navigation Actions */}
      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-6">
        <div>
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onPrev}
              disabled={isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Précédent</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isLastStep ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onNext}
              disabled={!canNext}
            >
              <span>Étape Suivante</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onSubmit}
              isLoading={isSubmitting}
            >
              <span>{submitLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
