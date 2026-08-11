import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from 'react-router-dom';
import { Bell, Search, X } from 'lucide-react';
import { SearchBar } from './SearchBar';

const pageLabels: Record<string, string> = {
  '/dashboard': 'Mi Día',
  '/progress': 'Mi Progreso',
  '/profile': 'Mi Perfil',
  '/admin': 'Panel Admin',
  '/admin/days': 'Gestionar Días',
  '/admin/users': 'Gestionar Usuarios',
  '/admin/analytics': 'Analytics',
};

export function DesktopHeader() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const currentTitle = pageLabels[location.pathname] || 'Círculo 1';

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-dark-100">{currentTitle}</h1>
      </div>
      <div className="flex items-center gap-4">
        {searchOpen ? (
          <div className="w-72">
            <SearchBar onClose={() => setSearchOpen(false)} />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
        <button className="p-2 rounded-xl text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-px h-8 bg-gray-200 dark:bg-dark-600"></div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-gray-900 dark:text-dark-100 leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 dark:text-dark-400">{user?.role === 'ADMIN' ? 'Administrador' : 'Miembro'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
