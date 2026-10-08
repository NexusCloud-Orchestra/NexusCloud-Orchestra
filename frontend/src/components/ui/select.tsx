import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs font-medium text-slate-900 shadow-xs transition-colors hover:bg-slate-50/80 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value?: string;
  placeholder?: string;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, value, placeholder, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-xs transition-colors hover:bg-slate-50/80 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          className
        )}
        {...props}
      >
        <span className={cn('truncate', !value && 'text-slate-400')}>
          {value || placeholder || children}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 ml-2" />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

