'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-normal transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--royal-primary)] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none';

    const variants = {
      primary:
        'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] hover:bg-[var(--royal-primary-hover)] shadow-sm border border-[var(--royal-gold-dark)]/40',
      secondary:
        'bg-[var(--royal-silver-light)] text-[var(--royal-ink)] hover:bg-slate-200/80 border border-[var(--royal-silver)]',
      outline:
        'border border-[var(--royal-border)] bg-white text-[var(--royal-ink)] hover:border-[var(--royal-primary)] hover:bg-[var(--royal-gold-light)] shadow-sm',
      ghost: 'text-slate-700 hover:bg-[var(--royal-silver-light)] hover:text-[var(--royal-ink)]',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-700',
      gold: 'bg-gradient-to-r from-[var(--royal-gold)] to-[var(--royal-primary-hover)] text-white hover:opacity-95 shadow-sm border border-[var(--royal-gold-dark)]/40',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      md: 'text-xs px-4 py-2 rounded-xl gap-2',
      lg: 'text-sm px-5 py-2.5 rounded-xl gap-2 shadow-sm',
      icon: 'w-9 h-9 p-1.5 rounded-lg flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
