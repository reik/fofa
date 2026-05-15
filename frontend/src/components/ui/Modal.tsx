import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 480,
}) => {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Lock body scroll and track previously focused element
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus first focusable element on open; trap Tab; close on Escape
  useEffect(() => {
    if (!open) return;

    // Prefer focusing the first input/textarea/select; fall back to any focusable
    const firstInput = containerRef.current?.querySelector<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
    );
    const firstFocusable =
      containerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstInput ?? firstFocusable)?.focus();

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onTabTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Escape on document so it works regardless of focus position
    document.addEventListener("keydown", onEscape);
    // Tab trap scoped to the container so it doesn't interfere with typing
    const container = containerRef.current;
    container?.addEventListener("keydown", onTabTrap);
    return () => {
      document.removeEventListener("keydown", onEscape);
      container?.removeEventListener("keydown", onTabTrap);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] p-4"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-lg border-[1.5px] border-border elevated-popover p-7 w-full shadow-lg fade-in max-h-[90vh] overflow-y-auto"
        style={{ maxWidth }}
      >
        {title && (
          <div className="flex justify-between items-center mb-5">
            <h2 id={titleId} className="font-heading text-[1.3rem]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="bg-transparent border-none text-[1.4rem] cursor-pointer text-muted leading-none"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
};
