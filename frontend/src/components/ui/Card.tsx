import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('px-6 py-4 border-b border-gray-100 dark:border-dark-700', className)} {...props}>{children}</div>
);

export const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('text-xl font-semibold leading-none tracking-tight text-gray-900 dark:text-dark-100', className)} {...props}>{children}</div>
);

export const CardDescription = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('text-sm text-gray-500 dark:text-dark-400', className)} {...props}>{children}</div>
);

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('px-6 py-4', className)} {...props}>{children}</div>
);

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('px-6 py-4 border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50', className)} {...props}>{children}</div>
);
