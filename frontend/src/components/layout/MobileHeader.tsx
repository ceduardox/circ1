import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Home, User, BarChart, LogOut, BookOpen, Users, Menu, X, LayoutDashboard } from 'lucide-react';

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

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
        className={`fixed inset-y-0 left-0 z-50 w-72 md:hidden bg-white shadow-xl transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú de navegación"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center gap-2" onClick={closeMenu}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C1</span>
              </div>
              <span className="font-semibold text-gray-900">Círculo 1</span>
            </Link>
            <button
              onClick={closeMenu}
              aria-label="Cerrar menú"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
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
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
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

          {/* User Info & Logout */}
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
              onClick={() => { logout(); navigate('/login'); closeMenu(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Top Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C1</span>
            </div>
            <span className="font-semibold text-gray-900">Círculo 1</span>
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
      </header>
    </>
  );
}