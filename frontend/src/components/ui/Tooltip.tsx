import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'right',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
  }[position];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 border border-slate-800 rounded-md shadow-md whitespace-nowrap pointer-events-none transition-all duration-150 animate-fadeIn',
            positionClasses
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
