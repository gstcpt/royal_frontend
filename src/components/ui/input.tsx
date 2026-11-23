'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, helperText, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = React.useState(false);
    const isPasswordType = type === 'password';
    const effectiveType = isPasswordType && showPassword ? 'text' : type;
    const effectiveRightIcon =
      rightIcon ??
      (isPasswordType ? (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          title={showPassword ? 'Masquer' : 'Afficher'}
          className="text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      ) : null);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={effectiveType}
            ref={ref}
            className={cn(
              'w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 disabled:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed',
              error ? 'border-red-400 focus:ring-red-500' : 'border-neutral-200 hover:border-neutral-300',
              leftIcon && 'pl-10',
              effectiveRightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {effectiveRightIcon && (
            <div className="absolute right-3.5 flex items-center text-neutral-400">
              {effectiveRightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-neutral-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
