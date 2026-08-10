import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'danger';
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, disabled, loading, size = 'md', variant = 'default', ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export const ButtonPrimary = ({ children, ...props }: ButtonProps) => (
  <Button className="bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm shadow-primary-600/20" {...props}>{children}</Button>
);

export const ButtonSecondary = ({ children, ...props }: ButtonProps) => (
  <Button className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400" {...props}>{children}</Button>
);

export const ButtonGhost = ({ children, ...props }: ButtonProps) => (
  <Button
    className={clsx(
      'bg-transparent',
      props.variant === 'danger'
        ? 'text-red-600 hover:bg-red-50'
        : 'hover:bg-gray-100'
    )}
    {...props}
  >
    {children}
  </Button>
);

export const ButtonDanger = ({ children, ...props }: ButtonProps) => (
  <Button className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-600/20" {...props}>{children}</Button>
);