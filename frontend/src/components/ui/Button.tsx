import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'danger';
}

const baseClasses = [
  'btn-press inline-flex items-center justify-center gap-2 rounded-xl font-medium',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-800',
  'disabled:opacity-50 disabled:cursor-not-allowed',
];

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
      className={clsx(baseClasses, sizeClasses[size], className)}
      {...props}
    >
      {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

function mergeProps(classNameParts: (string | undefined)[], props: ButtonProps): ButtonProps {
  const { className: callerClass, children, ...rest } = props;
  return { className: clsx(...classNameParts, callerClass), children, ...rest };
}

export const ButtonPrimary = ({ children, ...props }: ButtonProps) => (
  <Button
    {...mergeProps(
      [
        'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-600/25',
        'hover:from-primary-700 hover:to-primary-600 hover:shadow-lg hover:shadow-primary-600/35 hover:-translate-y-0.5',
        'focus:ring-primary-500',
      ],
      props
    )}
  >
    {children}
  </Button>
);

export const ButtonSecondary = ({ children, ...props }: ButtonProps) => (
  <Button
    {...mergeProps(
      [
        'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 shadow-sm',
        'hover:bg-gray-200 dark:hover:bg-dark-600 hover:-translate-y-0.5 focus:ring-gray-400',
      ],
      props
    )}
  >
    {children}
  </Button>
);

export const ButtonGhost = ({ children, ...props }: ButtonProps) => (
  <Button
    {...mergeProps(
      [
        'bg-transparent',
        props.variant === 'danger'
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700',
      ],
      props
    )}
  >
    {children}
  </Button>
);

export const ButtonDanger = ({ children, ...props }: ButtonProps) => (
  <Button
    {...mergeProps(
      [
        'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/25',
        'hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/35 hover:-translate-y-0.5',
        'focus:ring-red-500',
      ],
      props
    )}
  >
    {children}
  </Button>
);