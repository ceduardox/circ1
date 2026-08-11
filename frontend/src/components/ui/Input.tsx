import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={clsx(
        'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800',
        'text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800',
        'text-gray-900 dark:text-dark-100 placeholder-gray-400 dark:placeholder-dark-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[100px]',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={clsx('block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5', className)} {...props}>
    {children}
  </label>
);
