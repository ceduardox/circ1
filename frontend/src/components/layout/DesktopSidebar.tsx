import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Home, User, BarChart, LogOut, BookOpen, Users, LayoutDashboard } from 'lucide-react';

export function DesktopSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Mi Día', icon: Home },
    { path: '/progress', label: 'Progreso', icon: BarChart },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  const adminItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/days', label: 'Días', icon: BookOpen },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart },
  ];

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 z-40 shadow-sm">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C1</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Círculo 1</p>
              <p className="text-xs text-gray-500">Neuroentrenamiento</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {user?.role === 'ADMIN' && (
            <div className="pt-4">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administración
              </p>
              {adminItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}