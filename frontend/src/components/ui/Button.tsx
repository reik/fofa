import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontWeight: 600, borderRadius: 'var(--radius-md)',
    border: 'none', transition: 'all 0.18s ease', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  primary: { background: 'var(--c-brand)', color: '#fff' },
  secondary: { background: 'var(--c-brand-light)', color: 'var(--c-brand-dark)' },
  ghost: { background: 'transparent', color: 'var(--c-text-muted)', border: '1.5px solid var(--c-border)' },
  danger: { background: '#fee2e2', color: 'var(--c-danger)' },
  sm: { padding: '6px 14px', fontSize: '0.85rem' },
  md: { padding: '10px 20px', fontSize: '0.95rem' },
  lg: { padding: '13px 28px', fontSize: '1rem' },
  disabled: { opacity: 0.55, cursor: 'not-allowed' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, disabled, children, style, ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    style={{
      ...styles.base,
      ...styles[variant],
      ...styles[size],
      ...(disabled || loading ? styles.disabled : {}),
      ...style,
    }}
  >
    {loading && <Spinner size={16} />}
    {children}
  </button>
);

export const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);
