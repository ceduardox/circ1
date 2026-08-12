import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-700 text-white shadow-lg shadow-primary-600/25 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 leading-tight">{title}</h1>
          <div className="mt-1.5 h-1 w-12 rounded-full bg-gradient-to-r from-primary-600 to-purple-500" />
          {subtitle && <p className="text-gray-500 dark:text-dark-400 mt-2 text-sm">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
