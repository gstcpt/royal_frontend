'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
  compact?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  activeLabel = 'Actif',
  inactiveLabel = 'Inactif',
  disabled = false,
  compact = false,
  size = 'md',
  className,
  id,
  ariaLabel,
}: ToggleProps) {
  const generatedId = React.useId();
  const toggleId = id || generatedId;

  const isSm = size === 'sm';
  const switchButton = (
    <button
      id={toggleId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label || (checked ? activeLabel : inactiveLabel)}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C59B27]/25',
        isSm ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-[var(--royal-primary)]' : 'bg-slate-200',
        disabled && 'cursor-not-allowed opacity-60',
        compact && className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
          isSm ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (isSm ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
        )}
      />
    </button>
  );

  if (compact) {
    return switchButton;
  }

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={toggleId}
          className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700"
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          'flex items-center justify-between p-2.5 rounded-2xl border transition-all min-h-[42px] select-none',
          checked
            ? 'border-neutral-300 bg-white shadow-2xs'
            : 'border-neutral-200 bg-neutral-50/70',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2 pr-2 truncate">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0 transition-colors',
              checked ? 'bg-emerald-500 shadow-2xs' : 'bg-neutral-400'
            )}
          />
          <div className="truncate">
            <span
              className={cn(
                'text-xs font-semibold block truncate',
                checked ? 'text-neutral-900' : 'text-neutral-500'
              )}
            >
              {checked ? activeLabel : inactiveLabel}
            </span>
            {description && (
              <span className="text-[10px] text-neutral-400 block line-clamp-1">
                {description}
              </span>
            )}
          </div>
        </div>

        {switchButton}
      </div>
    </div>
  );
}

export interface StatusToggleProps<T extends string = string> {
  label?: string;
  value: T;
  activeValue: T;
  inactiveValue: T;
  activeLabel?: string;
  inactiveLabel?: string;
  description?: string;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function StatusToggle<T extends string = string>({
  label = 'Statut du Compte',
  value,
  activeValue,
  inactiveValue,
  activeLabel = 'Actif (Accès autorisé)',
  inactiveLabel = 'Suspendu (Accès bloqué)',
  description,
  onChange,
  disabled = false,
  className,
  id,
}: StatusToggleProps<T>) {
  const isActive = value === activeValue;

  return (
    <Toggle
      id={id}
      label={label}
      description={description}
      checked={isActive}
      onChange={(checked) => onChange(checked ? activeValue : inactiveValue)}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
      disabled={disabled}
      className={className}
    />
  );
}
