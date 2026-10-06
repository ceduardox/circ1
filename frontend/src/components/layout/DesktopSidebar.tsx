import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, User, BarChart, LogOut, BookOpen, Users, LayoutDashboard, Moon, Sun, Wallet, Network, Zap, Crown, FileText, Bell, Users2, ShoppingBag, FolderOpen, Link as LinkIcon, GitBranch, Calculator, TrendingUp, ChevronDown, Sparkles, Landmark, History } from 'lucide-react';
import { TikTokIcon, TikTokShopIcon } from '@/components/TikTokLogo';
import { useState, useEffect } from 'react';

const networkSubItems = [
  { path: '/network?tab=overview', tab: 'overview', label: 'Link y Planes', icon: LinkIcon, gradient: 'from-blue-500 to-indigo-600' },
  { path: '/network?tab=members', tab: 'members', label: 'Miembros', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
  { path: '/network?tab=tree', tab: 'tree', label: 'Árbol Gráfico', icon: GitBranch, gradient: 'from-purple-500 to-fuchsia-600' },
  { path: '/network?tab=calculator', tab: 'calculator', label: 'Calculadora', icon: Calculator, gradient: 'from-amber-500 to-orange-600' },
  { path: '/network?tab=stats', tab: 'stats', label: 'Estadísticas', icon: TrendingUp, gradient: 'from-sky-500 to-blue-600' },
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

export function DesktopSidebar() {
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const memberStatus = useMembershipStore(s => s.status);
  const [networkExpanded, setNetworkExpanded] = useState<boolean>(() => location.pathname === '/network');
  const [earningsExpanded, setEarningsExpanded] = useState<boolean>(() => location.pathname === '/earnings');
  const [tiktokExpanded, setTiktokExpanded] = useState<boolean>(() => location.pathname === '/tiktok-shop');

  useEffect(() => {
    if (location.pathname === '/network') {
      setNetworkExpanded(true);
    }
    if (location.pathname === '/earnings') {
      setEarningsExpanded(true);
    }
    if (location.pathname === '/tiktok-shop') {
      setTiktokExpanded(true);
    }
  }, [location.pathname]);

  // TikTok Shop solo se muestra si el plan del usuario lo incluye (checkbox en config).
  const hasTikTok = user?.role === 'ADMIN' || memberStatus?.pack?.tiktokAccess !== false;

  const navItems = [
    { path: '/dashboard', label: 'Mi Día', icon: Home, color: 'from-violet-500 to-purple-600' },
    { path: '/progress', label: 'Progreso', icon: BarChart, color: 'from-blue-500 to-indigo-600' },
    { path: '/network', label: 'Mi Red', icon: Network, color: 'from-emerald-500 to-teal-600', isExpandable: true, isExpanded: networkExpanded, toggleExpand: () => setNetworkExpanded(v => !v), subItems: networkSubItems },
    { path: '/team', label: 'Construir Equipo', icon: Users2, color: 'from-cyan-500 to-sky-600' },
    { path: '/earnings', label: 'Ganancias', icon: Wallet, color: 'from-amber-500 to-orange-600', isExpandable: true, isExpanded: earningsExpanded, toggleExpand: () => setEarningsExpanded(v => !v), subItems: earningsSubItems },
    { path: '/vip-pro', label: 'VIP Pro', icon: Crown, color: 'from-violet-600 to-fuchsia-600' },
    ...(hasTikTok ? [{ path: '/tiktok-shop', label: 'TikTok Shop', icon: TikTokIcon, color: 'from-pink-500 to-rose-600', isExpandable: true, isExpanded: tiktokExpanded, toggleExpand: () => setTiktokExpanded(v => !v), subItems: tiktokSubItems }] : []),
    { path: '/contenido', label: 'Contenido', icon: FolderOpen, color: 'from-teal-500 to-emerald-600' },
    { path: '/notifications', label: 'Notificaciones', icon: Bell, color: 'from-sky-500 to-blue-600' },
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
    { path: '/admin/tiktok', label: 'TikTok Shop', icon: TikTokShopIcon },
    { path: '/admin/network', label: 'Red Global', icon: Network },
  ];

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-60 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 z-40 shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="relative p-4 border-b border-gray-100 dark:border-dark-700 bg-gradient-to-br from-primary-50/60 via-white to-purple-50/60 dark:from-dark-800 dark:via-dark-800 dark:to-dark-800">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 via-purple-500 to-fuchsia-500 animate-gradient-x" />
          <Link to="/dashboard" className="flex items-center group">
            <img
              src="/images/logo.png"
              alt="Círculo 1"
              className="h-10 w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navItems.map(item => {
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
                      }
                    }}
                    className={`sidebar-link flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium group ${
                      active
                        ? 'sidebar-link-active text-white font-semibold'
                        : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-primary-700 dark:hover:text-primary-300 hover:translate-x-1'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                      active
                        ? 'bg-white/20 text-white'
                        : `bg-gradient-to-br ${item.color} text-white shadow-sm group-hover:scale-110 group-hover:shadow-md`
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                    {active && !isExpandable && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
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
                      className={`p-1.5 mr-1 rounded-lg transition-all ${
                        active
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
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
                          className={`flex items-center gap-2.5 py-1.5 px-2.5 rounded-xl text-xs font-medium transition-all ${
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
            <div className="pt-3">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-3 rounded-full bg-primary-500" /> Administración
              </p>
              {adminItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium group ${
                      active
                        ? 'sidebar-link-active text-white font-semibold'
                        : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-primary-700 dark:hover:text-primary-300 hover:translate-x-1'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                      active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-dark-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 group-hover:scale-110'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {item.label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all hover:translate-x-1"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 dark:from-amber-400 dark:to-orange-500 text-white dark:text-dark-900 flex items-center justify-center shadow-sm transition-transform duration-300 hover:rotate-12">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-700 bg-gradient-to-br from-primary-50/40 via-white to-purple-50/40 dark:from-dark-800 dark:via-dark-800 dark:to-dark-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center shadow-md shadow-primary-500/20">
              <span className="text-white font-bold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-dark-800" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wide">
                {user?.role === 'ADMIN' ? 'Admin' : 'Miembro'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:translate-x-1 group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <LogOut className="w-4 h-4" />
            </div>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
