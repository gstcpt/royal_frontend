'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  onClose,
  message,
  type = 'success',
  duration = 3500,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed bottom-6 right-6 z-[1000] max-w-md flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in',
        type === 'success' && 'bg-white text-[#1D232E] border-[#E6D6A6]',
        type === 'error' && 'bg-rose-50 text-rose-900 border-rose-200',
        type === 'info' && 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6]'
      )}
    >
      <div className="shrink-0">
        {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
        {type === 'info' && <Info className="w-4 h-4 text-[#C59B27]" />}
      </div>

      <div className="text-xs font-medium leading-relaxed flex-1">
        {message}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-neutral-400 hover:text-neutral-900 transition p-1 -mr-1 cursor-pointer"
        aria-label="Fermer la notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
