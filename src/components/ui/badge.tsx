'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'luxury' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    neutral: 'bg-[#F4F5F7] text-[#1D232E] border-[#CBD5E1]/70',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6]',
    danger: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-slate-100 text-slate-700 border-slate-300',
    luxury: 'bg-gradient-to-r from-[#C59B27] to-[#A67C1E] text-white border-[#B8860B]',
    outline: 'bg-white text-[#1D232E] border-[#E6E1D6]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider',
    md: 'text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border leading-none transition-colors select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusIndicator({
  status,
  label,
  className,
}: {
  status: 'active' | 'pending' | 'draft' | 'cancelled' | 'danger';
  label?: string;
  className?: string;
}) {
  const styles = {
    active: 'bg-emerald-500',
    pending: 'bg-amber-500',
    draft: 'bg-neutral-400',
    cancelled: 'bg-neutral-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={cn('inline-flex items-center gap-2 text-xs font-semibold', className)}>
      <span className={cn('w-2 h-2 rounded-full animate-pulse', styles[status])} />
      {label && <span>{label}</span>}
    </div>
  );
}
