import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full bg-white rounded-xl border border-slate-200 shadow-xl p-6 overflow-hidden transition-all',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
};

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmModal({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  tone = 'primary',
  loading = false,
  onConfirm,
  children,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        {(body ?? children) ? (
          <div className="py-4 text-xs text-slate-600 leading-normal">{body ?? children}</div>
        ) : null}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
