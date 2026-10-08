import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const normalizedVariant = variant === 'primary' ? 'default' : variant;

    const variants = {
      default:
        'bg-slate-900 text-white hover:bg-slate-800 shadow-xs active:bg-slate-950',
      secondary:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-xs',
      outline:
        'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-900 shadow-xs',
      ghost:
        'text-slate-700 hover:text-slate-900 hover:bg-slate-100',
      link:
        'text-blue-600 underline-offset-4 hover:underline p-0 h-auto font-medium',
      danger:
        'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-xs',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-6 text-sm',
      icon: 'h-8.5 w-8.5 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[normalizedVariant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
