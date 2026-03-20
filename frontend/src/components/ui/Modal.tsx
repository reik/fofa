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
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
          padding: '28px', width: '100%', maxWidth,
          boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.2s ease',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--c-text-muted)', lineHeight: 1 }}
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
