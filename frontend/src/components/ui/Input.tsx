import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', ...style as React.CSSProperties }}>
        {label && (
          <label htmlFor={inputId} style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--c-text-muted)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          style={{
            width: '100%', padding: '10px 14px',
            border: `1.5px solid ${error ? 'var(--c-danger)' : 'var(--c-border)'}`,
            borderRadius: 'var(--radius-sm)', fontSize: '0.95rem',
            outline: 'none', transition: 'border-color 0.15s',
            background: 'var(--c-surface)',
          }}
        />
        {error && <span style={{ fontSize: '0.8rem', color: 'var(--c-danger)' }}>{error}</span>}
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
  ({ label, error, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', ...style as React.CSSProperties }}>
        {label && (
          <label htmlFor={inputId} style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--c-text-muted)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          {...props}
          style={{
            width: '100%', padding: '10px 14px',
            border: `1.5px solid ${error ? 'var(--c-danger)' : 'var(--c-border)'}`,
            borderRadius: 'var(--radius-sm)', fontSize: '0.95rem',
            outline: 'none', resize: 'vertical', minHeight: '90px',
            background: 'var(--c-surface)', fontFamily: 'var(--font-body)',
          }}
        />
        {error && <span style={{ fontSize: '0.8rem', color: 'var(--c-danger)' }}>{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
