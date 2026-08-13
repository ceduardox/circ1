import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, User, BarChart, LogOut, BookOpen, Users, Menu, X, LayoutDashboard, Moon, Sun, Wallet, Network, Zap, Crown, FileText, Bell, Users2 } from 'lucide-react';

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Mi Día', icon: Home },
    { path: '/progress', label: 'Progreso', icon: BarChart },
    { path: '/network', label: 'Mi Red', icon: Network },
    { path: '/team', label: 'Construir Equipo', icon: Users2 },
    { path: '/earnings', label: 'Ganancias', icon: Wallet },
    { path: '/vip-pro', label: 'VIP Pro', icon: Crown },
    { path: '/notifications', label: 'Notificaciones', icon: Bell },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  const adminItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/days', label: 'Días', icon: BookOpen },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart },
    { path: '/admin/commissions', label: 'Comisiones', icon: Zap },
    { path: '/admin/withdrawals', label: 'Retiros', icon: Wallet },
    { path: '/admin/transcribe', label: 'Transcribir', icon: FileText },
    { path: '/admin/network', label: 'Red Global', icon: Network },
  ];

  const closeMenu = () => setOpen(false);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-fade-in"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 md:hidden bg-white dark:bg-dark-800 shadow-xl transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú de navegación"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-dark-700">
            <Link to="/dashboard" className="flex items-center min-w-0 flex-1" onClick={closeMenu}>
              <img
                src="/images/logo.png"
                alt="Círculo 1"
                className="h-9 w-auto max-w-full object-contain"
              />
            </Link>
            <button
              onClick={closeMenu}
              aria-label="Cerrar menú"
              className="p-2 rounded-lg text-gray-500 dark:text-dark-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-700 dark:hover:text-dark-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                      : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-dark-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            {user?.role === 'ADMIN' && (
              <div className="pt-4">
                <p className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider">
                  Administración
                </p>
                {adminItems.map(item => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                          : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-dark-100'
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

          {/* Dark Mode Toggle */}
          <div className="px-3 pb-2">
            <button
              onClick={toggle}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              {isDark ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
          </div>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-100 dark:border-dark-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); closeMenu(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center min-w-0 flex-1">
            <img
              src="/images/logo.png"
              alt="Círculo 1"
              className="h-9 w-auto max-w-full object-contain dark:brightness-200 dark:opacity-90"
            />
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/notifications"
              className="p-2 rounded-xl text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              aria-label="Notificaciones push"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setOpen(!open)}
              aria-label="Abrir menú"
              className="relative px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium text-sm shadow-md shadow-primary-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/40 hover:translate-y-[-1px] active:scale-[0.98] active:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <span className="flex items-center gap-2 transition-all duration-300 ease-out" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
                <Menu className="w-5 h-5" />
              </span>
              <span className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out opacity-0 pointer-events-none" style={{ transform: open ? 'rotate(0)' : 'rotate(-180deg)' }}>
                <X className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
