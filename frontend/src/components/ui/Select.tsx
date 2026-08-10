import { SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        'flex h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select as SelectContent };
export { Select as SelectItem };
export { Select as SelectTrigger };
export const SelectValue = ({ children }: { children?: React.ReactNode }) => <>{children}</>;