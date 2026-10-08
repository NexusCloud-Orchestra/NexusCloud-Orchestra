import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: 'right' | 'left';
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'right',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#102A43]/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-out border-l border-[#E4EDF3]',
          side === 'right' ? 'ml-auto' : 'mr-auto'
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-[#E4EDF3]">
          <div>
            <h2 className="text-base font-bold text-[#102A43]">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-[#526A7A]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#526A7A] hover:text-[#102A43] hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-5">{children}</div>
      </div>
    </div>
  );
};
