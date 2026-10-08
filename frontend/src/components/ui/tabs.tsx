import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full space-y-4', className)} {...props} />
  )
);
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 border border-slate-200/60 shadow-2xs',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-white text-slate-900 shadow-xs font-semibold'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
        className
      )}
      {...props}
    />
  )
);
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

