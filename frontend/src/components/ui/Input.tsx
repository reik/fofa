import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={`flex flex-col gap-[5px] ${className ?? ''}`}>
        {label && (
          <label htmlFor={inputId} className="font-semibold text-[0.88rem] text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={[
            'w-full px-[14px] py-[10px] rounded-sm text-[0.95rem] outline-none transition-colors duration-150 bg-surface',
            error ? 'border-[1.5px] border-red-600' : 'border-[1.5px] border-border',
          ].join(' ')}
        />
        {error && <span className="text-[0.8rem] text-red-600">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className={`flex flex-col gap-[5px] ${className ?? ''}`}>
        {label && (
          <label htmlFor={inputId} className="font-semibold text-[0.88rem] text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          {...props}
          className={[
            'w-full px-[14px] py-[10px] rounded-sm text-[0.95rem] outline-none resize-y min-h-[90px] bg-surface font-body',
            error ? 'border-[1.5px] border-red-600' : 'border-[1.5px] border-border',
          ].join(' ')}
        />
        {error && <span className="text-[0.8rem] text-red-600">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
