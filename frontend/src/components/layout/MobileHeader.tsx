import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, User, BarChart, LogOut, BookOpen, Users, Menu, X, LayoutDashboard, Moon, Sun, Wallet, Network, Zap, Crown, FileText, Bell, BellRing, Sliders, Smartphone, Users2, ShoppingBag, FolderOpen, Link as LinkIcon, GitBranch, Calculator, TrendingUp, ChevronDown, Landmark, History, Award, Flame, Target, CalendarCheck, Sparkles, Compass, Package, DollarSign } from 'lucide-react';
import { TikTokIcon, TikTokShopIcon } from '@/components/TikTokLogo';

const progressSubItems = [
  { path: '/progress?tab=overview', tab: 'overview', label: 'Mi Nivel y Resumen', icon: BarChart, gradient: 'from-blue-500 to-indigo-600' },
  { path: '/progress?tab=days', tab: 'days', label: 'Días del Programa', icon: BookOpen, gradient: 'from-violet-500 to-purple-600' },
  { path: '/progress?tab=achievements', tab: 'achievements', label: 'Logros y Medallas', icon: Award, gradient: 'from-amber-500 to-yellow-600' },
  { path: '/progress?tab=reflections', tab: 'reflections', label: 'Mis Reflexiones', icon: Target, gradient: 'from-emerald-500 to-teal-600' },
  { path: '/progress?tab=stats', tab: 'stats', label: 'Racha y Hábitos', icon: Flame, gradient: 'from-rose-500 to-orange-500' },
];

const networkSubItems = [
  { path: '/network?tab=overview', tab: 'overview', label: 'Link y Planes', icon: LinkIcon, gradient: 'from-blue-500 to-indigo-600' },
  { path: '/network?tab=members', tab: 'members', label: 'Miembros', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
  { path: '/network?tab=tree', tab: 'tree', label: 'Árbol Gráfico', icon: GitBranch, gradient: 'from-purple-500 to-fuchsia-600' },
  { path: '/network?tab=calculator', tab: 'calculator', label: 'Calculadora', icon: Calculator, gradient: 'from-amber-500 to-orange-600' },
  { path: '/network?tab=stats', tab: 'stats', label: 'Estadísticas', icon: TrendingUp, gradient: 'from-sky-500 to-blue-600' },
];

const teamSubItems = [
  { path: '/team?tab=contacts', tab: 'contacts', label: 'Mis Contactos CRM', icon: Users2, gradient: 'from-cyan-500 to-sky-600' },
  { path: '/team?tab=guides', tab: 'guides', label: 'Guías y Guiones', icon: BookOpen, gradient: 'from-emerald-500 to-teal-600' },
  { path: '/team?tab=calendar', tab: 'calendar', label: 'Calendario Social', icon: CalendarCheck, gradient: 'from-purple-500 to-fuchsia-600' },
  { path: '/team?tab=strategy', tab: 'strategy', label: 'Estrategia', icon: Target, gradient: 'from-amber-500 to-orange-600' },
  { path: '/team?tab=calculator', tab: 'calculator', label: 'Calculadora Equipo', icon: Calculator, gradient: 'from-blue-500 to-indigo-600' },
];

const earningsSubItems = [
  { path: '/earnings?tab=wallet', tab: 'wallet', label: 'Billetera y Retiro', icon: Wallet, gradient: 'from-amber-500 to-orange-600' },
  { path: '/earnings?tab=commissions', tab: 'commissions', label: 'Comisiones', icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600' },
  { path: '/earnings?tab=accounts', tab: 'accounts', label: 'Cuentas de Cobro', icon: Landmark, gradient: 'from-blue-500 to-indigo-600' },
  { path: '/earnings?tab=withdrawals', tab: 'withdrawals', label: 'Historial de Retiros', icon: History, gradient: 'from-purple-500 to-fuchsia-600' },
  { path: '/earnings?tab=calculator', tab: 'calculator', label: 'Calculadora Fee', icon: Calculator, gradient: 'from-cyan-500 to-blue-600' },
];

const tiktokSubItems = [
  { path: '/tiktok-shop?tab=creators', tab: 'creators', label: 'Creadores', icon: Users, gradient: 'from-pink-500 to-rose-600' },
  { path: '/tiktok-shop?tab=products', tab: 'products', label: 'Catálogo y Slots', icon: ShoppingBag, gradient: 'from-purple-500 to-indigo-600' },
  { path: '/tiktok-shop?tab=sales', tab: 'sales', label: 'Ventas y Ganancias', icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600' },
  { path: '/tiktok-shop?tab=material', tab: 'material', label: 'Material Creativo', icon: FolderOpen, gradient: 'from-amber-500 to-orange-600' },
  { path: '/tiktok-shop?tab=calculator', tab: 'calculator', label: 'Calculadora', icon: Calculator, gradient: 'from-cyan-500 to-blue-600' },
];

const contenidoSubItems = [
  { path: '/contenido?tab=materials', tab: 'materials', label: 'Material de Productos', icon: FolderOpen, gradient: 'from-teal-500 to-emerald-600' },
  { path: '/contenido?tab=scripts', tab: 'scripts', label: 'Guiones y Hooks', icon: FileText, gradient: 'from-amber-500 to-orange-600' },
  { path: '/contenido?tab=templates', tab: 'templates', label: 'Plantillas y Overlays', icon: Sparkles, gradient: 'from-purple-500 to-indigo-600' },
  { path: '/contenido?tab=guidelines', tab: 'guidelines', label: 'Algoritmo y Reglas', icon: Compass, gradient: 'from-pink-500 to-rose-600' },
];

const notificationsSubItems = [
  { path: '/notifications?tab=inbox', tab: 'inbox', label: 'Bandeja de Entrada', icon: Bell, gradient: 'from-sky-500 to-blue-600' },
  { path: '/notifications?tab=push', tab: 'push', label: 'Configuración Push', icon: BellRing, gradient: 'from-emerald-500 to-teal-600' },
  { path: '/notifications?tab=channels', tab: 'channels', label: 'Canales y Alertas', icon: Sliders, gradient: 'from-purple-500 to-indigo-600' },
  { path: '/notifications?tab=guide', tab: 'guide', label: 'Guía Dispositivos', icon: Smartphone, gradient: 'from-amber-500 to-orange-600' },
];

const adminTikTokSubItems = [
  { path: '/admin/tiktok?tab=usuarios', tab: 'usuarios', label: 'Usuarios y Campañas', icon: Users, gradient: 'from-blue-500 to-indigo-600' },
  { path: '/admin/tiktok?tab=productos', tab: 'productos', label: 'Catálogo Productos', icon: Package, gradient: 'from-purple-500 to-fuchsia-600' },
  { path: '/admin/tiktok?tab=material', tab: 'material', label: 'Material Creativo', icon: FolderOpen, gradient: 'from-teal-500 to-emerald-600' },
  { path: '/admin/tiktok?tab=comisiones', tab: 'comisiones', label: 'Comisiones TikTok', icon: DollarSign, gradient: 'from-amber-500 to-orange-600' },
];

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const memberStatus = useMembershipStore(s => s.status);
  const [progressExpanded, setProgressExpanded] = useState<boolean>(() => location.pathname === '/progress');
  const [networkExpanded, setNetworkExpanded] = useState<boolean>(() => location.pathname === '/network');
  const [teamExpanded, setTeamExpanded] = useState<boolean>(() => location.pathname === '/team');
  const [earningsExpanded, setEarningsExpanded] = useState<boolean>(() => location.pathname === '/earnings');
  const [tiktokExpanded, setTiktokExpanded] = useState<boolean>(() => location.pathname === '/tiktok-shop');
  const [contenidoExpanded, setContenidoExpanded] = useState<boolean>(() => location.pathname === '/contenido');
  const [notificationsExpanded, setNotificationsExpanded] = useState<boolean>(() => location.pathname === '/notifications');
  const [adminTiktokExpanded, setAdminTiktokExpanded] = useState<boolean>(() => location.pathname === '/admin/tiktok');

  useEffect(() => {
    if (location.pathname === '/progress') {
      setProgressExpanded(true);
    }
    if (location.pathname === '/network') {
      setNetworkExpanded(true);
    }
    if (location.pathname === '/team') {
      setTeamExpanded(true);
    }
    if (location.pathname === '/earnings') {
      setEarningsExpanded(true);
    }
    if (location.pathname === '/tiktok-shop') {
      setTiktokExpanded(true);
    }
    if (location.pathname === '/contenido') {
      setContenidoExpanded(true);
    }
    if (location.pathname === '/notifications') {
      setNotificationsExpanded(true);
    }
    if (location.pathname === '/admin/tiktok') {
      setAdminTiktokExpanded(true);
    }
  }, [location.pathname]);

  // TikTok Shop solo se muestra si el plan del usuario lo incluye (checkbox en config).
  const hasTikTok = user?.role === 'ADMIN' || memberStatus?.pack?.tiktokAccess !== false;

  const navItems = [
    { path: '/dashboard', label: 'Mi Día', icon: Home, color: 'from-violet-500 to-purple-600' },
    { path: '/progress', label: 'Progreso', icon: BarChart, color: 'from-blue-500 to-indigo-600', isExpandable: true, isExpanded: progressExpanded, toggleExpand: () => setProgressExpanded(v => !v), subItems: progressSubItems },
    { path: '/network', label: 'Mi Red', icon: Network, color: 'from-emerald-500 to-teal-600', isExpandable: true, isExpanded: networkExpanded, toggleExpand: () => setNetworkExpanded(v => !v), subItems: networkSubItems },
    { path: '/team', label: 'Construir Equipo', icon: Users2, color: 'from-cyan-500 to-sky-600', isExpandable: true, isExpanded: teamExpanded, toggleExpand: () => setTeamExpanded(v => !v), subItems: teamSubItems },
    { path: '/earnings', label: 'Ganancias', icon: Wallet, color: 'from-amber-500 to-orange-600', isExpandable: true, isExpanded: earningsExpanded, toggleExpand: () => setEarningsExpanded(v => !v), subItems: earningsSubItems },
    { path: '/vip-pro', label: 'VIP Pro', icon: Crown, color: 'from-violet-600 to-fuchsia-600' },
    ...(hasTikTok ? [{ path: '/tiktok-shop', label: 'TikTok Shop', icon: TikTokIcon, color: 'from-pink-500 to-rose-600', isExpandable: true, isExpanded: tiktokExpanded, toggleExpand: () => setTiktokExpanded(v => !v), subItems: tiktokSubItems }] : []),
    { path: '/contenido', label: 'Contenido', icon: FolderOpen, color: 'from-teal-500 to-emerald-600', isExpandable: true, isExpanded: contenidoExpanded, toggleExpand: () => setContenidoExpanded(v => !v), subItems: contenidoSubItems },
    { path: '/notifications', label: 'Notificaciones', icon: Bell, color: 'from-sky-500 to-blue-600', isExpandable: true, isExpanded: notificationsExpanded, toggleExpand: () => setNotificationsExpanded(v => !v), subItems: notificationsSubItems },
    { path: '/profile', label: 'Perfil', icon: User, color: 'from-pink-500 to-rose-600' },
  ];

  const adminItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/days', label: 'Días', icon: BookOpen },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart },
    { path: '/admin/commissions', label: 'Comisiones', icon: Zap },
    { path: '/admin/withdrawals', label: 'Retiros', icon: Wallet },
    { path: '/admin/transcribe', label: 'Transcribir', icon: FileText },
    { path: '/admin/tiktok', label: 'TikTok Shop', icon: TikTokShopIcon, isExpandable: true, isExpanded: adminTiktokExpanded, toggleExpand: () => setAdminTiktokExpanded(v => !v), subItems: adminTikTokSubItems },
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
              const isExpandable = item.isExpandable;
              const isExpanded = item.isExpanded;
              const subItems = item.subItems;

              return (
                <div key={item.path} className="space-y-1">
                  <div className="flex items-center">
                    <Link
                      to={item.path}
                      onClick={() => {
                        closeMenu();
                        if (isExpandable && !isExpanded && item.toggleExpand) {
                          item.toggleExpand();
                        }
                      }}
                      className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                          : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-dark-100'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-primary-600 text-white shadow-sm'
                          : `bg-gradient-to-br ${item.color} text-white shadow-sm`
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </Link>

                    {isExpandable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.toggleExpand) item.toggleExpand();
                        }}
                        aria-label="Desplegar o plegar submenú"
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-all ml-1"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {isExpandable && isExpanded && subItems && (
                    <div className="pl-6 pr-2 py-1 space-y-1 animate-fade-in">
                      {subItems.map(sub => {
                        const SubIcon = sub.icon;
                        const defaultTab = subItems[0]?.tab;
                        const isSubActive = location.pathname === item.path && (location.search.includes(`tab=${sub.tab}`) || (!location.search && sub.tab === defaultTab));
                        return (
                          <Link
                            key={sub.tab}
                            to={sub.path}
                            onClick={closeMenu}
                            className={`flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                              isSubActive
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
                                : 'text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${sub.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                              <SubIcon className="w-3 h-3 text-white" />
                            </div>
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                  const isExpandable = item.isExpandable;
                  const isExpanded = item.isExpanded;
                  const subItems = item.subItems;

                  return (
                    <div key={item.path} className="space-y-0.5">
                      <div className="flex items-center">
                        <Link
                          to={item.path}
                          onClick={() => {
                            if (isExpandable && !isExpanded && item.toggleExpand) {
                              item.toggleExpand();
                            } else if (!isExpandable) {
                              closeMenu();
                            }
                          }}
                          className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                            active
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-dark-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="truncate">{item.label}</span>
                        </Link>

                        {isExpandable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (item.toggleExpand) item.toggleExpand();
                            }}
                            title={isExpanded ? "Plegar submenú" : "Desplegar submenú"}
                            className="p-2 mr-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-all"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {isExpandable && isExpanded && subItems && (
                        <div className="pl-6 pr-1 py-1 space-y-1 animate-fade-in">
                          {subItems.map(sub => {
                            const SubIcon = sub.icon;
                            const defaultTab = subItems[0]?.tab;
                            const isSubActive = location.pathname === item.path && (location.search.includes(`tab=${sub.tab}`) || (!location.search && sub.tab === defaultTab));
                            return (
                              <Link
                                key={sub.tab}
                                to={sub.path}
                                onClick={closeMenu}
                                className={`flex items-center gap-2.5 py-2 px-2.5 rounded-xl text-xs font-medium transition-all ${
                                  isSubActive
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
                                    : 'text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-50 dark:hover:bg-dark-700/50'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${sub.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                                  <SubIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="truncate">{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
