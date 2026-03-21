import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:   'bg-brand text-white',
  secondary: 'bg-brand-light text-brand-dark',
  ghost:     'bg-transparent text-muted border border-border',
  danger:    'bg-red-100 text-red-600',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-[14px] py-[6px] text-[0.85rem]',
  md: 'px-5 py-[10px] text-[0.95rem]',
  lg: 'px-7 py-[13px] text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={[
      'inline-flex items-center justify-center gap-2 font-semibold rounded-md border-none transition-all duration-[180ms] cursor-pointer font-body',
      variantClasses[variant],
      sizeClasses[size],
      (disabled || loading) ? 'opacity-55 cursor-not-allowed' : '',
      className,
    ].join(' ')}
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
