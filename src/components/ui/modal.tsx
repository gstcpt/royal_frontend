'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { resolveFormKeyFromPath, useOptionalAiAssistant } from '@/providers/AiAssistantProvider';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'fullscreen';
export type ModalType = 'create' | 'edit' | 'delete' | 'details' | 'wizard' | 'custom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  type?: ModalType;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  closeOnOutsideClick?: boolean;
  aiFormKey?: string;
  enableAiFill?: boolean;
}

const openModalStack: string[] = [];

function setReactControlValue(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  val: string,
) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
      ? window.HTMLSelectElement.prototype
      : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  const tracker = (el as any)._valueTracker;
  if (tracker) {
    tracker.setValue('__royal_ai_prev__');
  }
  if (descriptor && descriptor.set) {
    descriptor.set.call(el, val);
  } else {
    (el as any).value = val;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  type = 'custom',
  size = 'md',
  children,
  footer,
  className,
  bodyClassName,
  closeOnOutsideClick = true,
  aiFormKey,
  enableAiFill = true,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [stackIndex, setStackIndex] = React.useState(0);
  const [aiStatusNotice, setAiStatusNotice] = React.useState<string | null>(null);
  const [hasDetectedFormFields, setHasDetectedFormFields] = React.useState(false);
  const modalId = React.useId();
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const aiCtx = useOptionalAiAssistant();

  const resolvedFormKey = React.useMemo(() => {
    if (aiFormKey) return aiFormKey;
    if (typeof window !== 'undefined') return resolveFormKeyFromPath(window.location.pathname);
    return 'generic';
  }, [aiFormKey]);

  React.useEffect(() => {
    if (!isOpen || !mounted) {
      setHasDetectedFormFields(false);
      return;
    }
    if (type === 'create' || type === 'edit') {
      setHasDetectedFormFields(true);
      return;
    }
    if (type === 'delete' || type === 'details') {
      setHasDetectedFormFields(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const root = bodyRef.current;
      if (!root) {
        setHasDetectedFormFields(false);
        return;
      }
      const controls = Array.from(
        root.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([type="password"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])',
        ),
      ).filter((el) => {
        const ph = (el.getAttribute('placeholder') || '').toLowerCase();
        return !ph.includes('rechercher') && !ph.includes('search');
      });
      setHasDetectedFormFields(controls.length >= 2);
    }, 35);
    return () => window.clearTimeout(timer);
  }, [isOpen, mounted, type]);

  const showAiFillButton =
    Boolean(aiCtx) &&
    enableAiFill !== false &&
    hasDetectedFormFields &&
    Boolean(aiCtx?.isFormEnabled(resolvedFormKey));

  const handleAiFormFill = React.useCallback(async () => {
    if (!aiCtx || !bodyRef.current) return;
    const container = bodyRef.current;
    const elements = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input:not([type="hidden"]):not([type="password"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])',
      ),
    );

    if (elements.length === 0) return;

    const fieldRegistry: Array<{
      key: string;
      label: string;
      type: string;
      options?: string[];
      el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    }> = [];
    const currentValues: Record<string, string> = {};

    elements.forEach((el, idx) => {
      const wrapper = el.closest('div');
      const labelEl =
        (el.id ? container.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null) ||
        wrapper?.querySelector('label') ||
        wrapper?.parentElement?.querySelector('label');
      const labelText = (labelEl?.textContent || el.getAttribute('placeholder') || el.name || `Champ ${idx + 1}`).trim();
      const key = el.name || `field_${idx}`;
      const options =
        el instanceof HTMLSelectElement
          ? Array.from(el.options).map((o) => o.value).filter(Boolean)
          : undefined;

      fieldRegistry.push({
        key,
        label: labelText,
        type: el instanceof HTMLSelectElement ? 'select' : el instanceof HTMLTextAreaElement ? 'textarea' : el.type || 'text',
        ...(options ? { options } : {}),
        el,
      });
      currentValues[key] = el.value || '';
    });

    const formTitleStr = typeof title === 'string' ? title : `Formulaire (${resolvedFormKey})`;
    const res: any = await aiCtx.runAiJob({
      mode: 'FORM_AUTOFILL',
      title: `Auto-remplissage IA — ${formTitleStr}`,
      subtitle: 'Analyse des champs du formulaire et génération intelligente',
      payload: {
        formKey: resolvedFormKey,
        formTitle: formTitleStr,
        mode: type,
        fields: fieldRegistry.map(({ el: _omit, ...meta }) => meta),
        currentValues,
      },
    });

    const payload = res?.data || res;
    const suggested = payload?.values && typeof payload.values === 'object' ? payload.values : null;
    if (!suggested) return;

    let filledCount = 0;
    fieldRegistry.forEach(({ key, el }) => {
      const nextVal = suggested[key];
      if (nextVal !== undefined && nextVal !== null && String(nextVal).trim() !== '') {
        setReactControlValue(el, String(nextVal));
        filledCount++;
      }
    });

    if (filledCount > 0) {
      setAiStatusNotice(
        `${filledCount} champ(s) complété(s) par Worker ${res?.workerNumber || 1} (${res?.provider || 'IA'}).`,
      );
      setTimeout(() => setAiStatusNotice(null), 5000);
    }
  }, [aiCtx, resolvedFormKey, title, type]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Manage nested modal stacking, scroll-lock, and topmost-only Escape key handling
  React.useEffect(() => {
    if (!isOpen) return;

    if (!openModalStack.includes(modalId)) {
      openModalStack.push(modalId);
    }
    setStackIndex(Math.max(0, openModalStack.indexOf(modalId)));
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && openModalStack[openModalStack.length - 1] === modalId) {
        event.stopPropagation();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      const idx = openModalStack.indexOf(modalId);
      if (idx !== -1) openModalStack.splice(idx, 1);
      if (openModalStack.length === 0) {
        document.body.style.overflow = '';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, modalId, onClose]);

  if (!isOpen || !mounted) return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    '5xl': 'max-w-7xl',
    fullscreen: 'max-w-[96vw] h-[92vh] flex flex-col',
  };

  const typeHeaderStyles: Record<ModalType, { icon?: React.ReactNode; badge?: string; badgeClass?: string }> = {
    create: {
      badge: 'Nouveau',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    edit: {
      badge: 'Modification',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    delete: {
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      badge: 'Confirmation de Suppression',
      badgeClass: 'bg-red-50 text-red-800 border-red-200',
    },
    details: {
      icon: <Info className="w-5 h-5 text-neutral-900" />,
      badge: 'Fiche Détaillée',
      badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    },
    wizard: {
      badge: 'Assistant Étape par Étape',
      badgeClass: 'bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]',
    },
    custom: {},
  };

  const currentType = typeHeaderStyles[type];

  const modalContent = (
    <div
      style={{ zIndex: 100 + stackIndex * 10 }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* Backdrop covering 100% of viewport with heavy blur and masking so nothing behind is readable */}
      <div
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-md transition-opacity duration-200"
        onClick={() => {
          if (closeOnOutsideClick) onClose();
        }}
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full mx-auto my-auto rounded-2xl border border-[#E6E1D6] bg-white shadow-2xl transition-all duration-200 z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 sm:px-6 py-4 bg-[#FBF9F4]/90 shrink-0 no-print">
          <div className="flex items-center gap-3 min-w-0">
            {icon || currentType.icon}
            <div className="min-w-0">
              {currentType.badge && (
                <span
                  className={cn(
                    'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 border',
                    currentType.badgeClass
                  )}
                >
                  {currentType.badge}
                </span>
              )}
              {typeof title === 'string' ? (
                <h3 className="font-heading font-black text-base sm:text-lg text-[#1D232E] tracking-tight break-words">
                  {title}
                </h3>
              ) : (
                <div className="font-heading font-black text-base sm:text-lg text-[#1D232E] tracking-tight break-words">
                  {title}
                </div>
              )}
              {subtitle && <p className="text-xs text-neutral-500 mt-0.5 break-words">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showAiFillButton && (
              <button
                type="button"
                onClick={handleAiFormFill}
                title="Compléter automatiquement ce formulaire avec l'IA"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FBF6E8] hover:bg-[var(--royal-primary)] text-[#9A7414] hover:text-white border border-[#E6D6A6] text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remplir par IA</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body with guaranteed zero horizontal scrolling and standardized padding */}
        <div
          ref={bodyRef}
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden [&>*:first-child:not([class*="p-"]):not([class*="px-"]):not([class*="md:flex-row"])]:p-6',
            bodyClassName
          )}
        >
          {aiStatusNotice && (
            <div className="mx-6 mt-4 mb-0 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{aiStatusNotice}</span>
            </div>
          )}
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="border-t border-neutral-100 px-5 sm:px-6 py-3.5 bg-[#FBF9F4]/90 flex flex-wrap items-center justify-end gap-3 shrink-0 no-print">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

// Reusable Confirmation Dialog for Deletions
export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  message?: string;
  itemName?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  description,
  message,
  itemName,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const resolvedDesc =
    description ||
    message ||
    (itemName
      ? `Êtes-vous sûr de vouloir supprimer ${itemName} ? Cette action est irréversible.`
      : 'Cette action est irréversible. L’élément sera définitivement supprimé de la base de données.');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type="delete"
      size="sm"
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 border border-neutral-200 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <span>Confirmer la suppression</span>
            )}
          </button>
        </>
      }
    >
      <div className="p-5 text-xs text-neutral-600 leading-relaxed font-normal">
        {resolvedDesc}
      </div>
    </Modal>
  );
}
