import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, maxWidth = 480 }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface rounded-lg p-7 w-full shadow-lg fade-in max-h-[90vh] overflow-y-auto"
        style={{ maxWidth }}
      >
        {title && (
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-display text-[1.3rem]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="bg-transparent border-none text-[1.4rem] cursor-pointer text-muted leading-none"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};
