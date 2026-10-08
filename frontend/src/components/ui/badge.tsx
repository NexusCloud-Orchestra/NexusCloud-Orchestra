import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'destructive' | 'neutral' | 'outline';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight transition-colors';

  const variants = {
    default: 'bg-slate-900 text-white',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    destructive: 'bg-rose-600 text-white',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200/60',
    outline: 'border border-slate-200 text-slate-700 bg-white',
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
}
