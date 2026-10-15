import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  entityName?: string;
  itemType?: string;
  entityType?: string;
  description?: string;
  warningMessage?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  isDeleting?: boolean;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  entityName,
  itemType = 'record',
  entityType,
  description,
  warningMessage,
  onConfirm,
  onCancel,
  onClose,
  isDeleting = false,
  isLoading = false,
}) => {
  const handleClose = () => {
    if (activeDeleting) return;
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  const activeDeleting = isDeleting || isLoading;
  const activeName = entityName || itemName;
  const activeType = entityType || itemType;
  const activeDescription = warningMessage || description;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !activeDeleting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeDeleting, onCancel, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !activeDeleting) {
          handleClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight">
                {title}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={activeDeleting}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              {activeDescription || `Are you sure you want to permanently delete this ${activeType}? This action cannot be reversed.`}
            </p>

            {activeName && (
              <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] font-mono text-xs text-rose-400 break-all font-semibold">
                {activeName}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-main)]">
          <button
            type="button"
            onClick={handleClose}
            disabled={activeDeleting}
            className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!activeDeleting) {
                onConfirm();
              }
            }}
            disabled={activeDeleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition shadow-md shadow-rose-900/30 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{activeDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
