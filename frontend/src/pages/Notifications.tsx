import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Bell, BellRing, Search, X, CheckCircle2, TrendingUp, Info, Wallet,
  Crown, UserPlus, Trophy, AtSign, MessageCircle, CheckCheck, Trash2,
  Filter, Sparkles, ChevronRight, Smartphone, Laptop, ExternalLink,
  ShieldCheck, RefreshCw, Send, Layers, Flame, Sliders, Check, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { membershipApi } from '@/services/api';
import { PageHeader } from '@/components/ui';
import { PushNotificationsPanel } from '@/components/program/PushNotificationsPanel';
import { hasPushPermission, getNativePushPermission } from '@/lib/onesignal';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Iconografía y estilos por categoría de notificación
const typeMeta: Record<string, {
  label: string;
  icon: any;
  gradient: string;
  badge: string;
  linkText?: string;
  linkHref?: string;
}> = {
  commission: {
    label: 'Comisión',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50',
    linkText: 'Ver Billetera',
    linkHref: '/earnings?tab=wallet',
  },
  payment: {
    label: 'Pago Recibido',
    icon: CheckCircle2,
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50',
    linkText: 'Ver Detalles',
    linkHref: '/earnings?tab=commissions',
  },
  withdrawal: {
    label: 'Retiro',
    icon: Wallet,
    gradient: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50',
    linkText: 'Historial Retiros',
    linkHref: '/earnings?tab=withdrawals',
  },
  membership: {
    label: 'Membresía',
    icon: Crown,
    gradient: 'from-purple-500 to-fuchsia-600',
    badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50',
    linkText: 'Ver Mi Plan',
    linkHref: '/network?tab=overview',
  },
  referral: {
    label: 'Nuevo Afiliado',
    icon: UserPlus,
    gradient: 'from-cyan-500 to-sky-600',
    badge: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200/50',
    linkText: 'Ver Mi Red',
    linkHref: '/network?tab=members',
  },
  achievement: {
    label: 'Logro / Medalla',
    icon: Trophy,
    gradient: 'from-yellow-500 to-amber-600',
    badge: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200/50',
    linkText: 'Ver Logros',
    linkHref: '/progress?tab=achievements',
  },
  mention: {
    label: 'Mención Chat',
    icon: AtSign,
    gradient: 'from-indigo-500 to-purple-600',
    badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/50',
    linkText: 'Ir al Chat',
    linkHref: '/chat',
  },
  chat: {
    label: 'Mensaje Chat',
    icon: MessageCircle,
    gradient: 'from-pink-500 to-rose-600',
    badge: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200/50',
    linkText: 'Abrir Chat',
    linkHref: '/chat',
  },
  info: {
    label: 'Sistema',
    icon: Info,
    gradient: 'from-slate-500 to-gray-700',
    badge: 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300 border-gray-200/60',
    linkText: 'Ver Panel',
    linkHref: '/dashboard',
  },
};

// Resaltado de coincidencias estilo WhatsApp en negrita
function highlightMatch(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-400/30 text-amber-900 dark:text-amber-200 font-bold px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// Formateo de fecha amigable
function formatRelativeTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} h`;
    if (diffDays === 1) return `Ayer a las ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'inbox';
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'UNREAD' | 'commission' | 'payment' | 'chat' | 'mention' | 'achievement'>('ALL');
  const [pushGranted, setPushGranted] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await membershipApi.notifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch {
      // silencioso
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    hasPushPermission().then(granted => setPushGranted(granted));
  }, [loadNotifications]);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const markAllRead = async () => {
    if (unreadCount === 0) {
      toast.info('Todas las notificaciones ya están leídas');
      return;
    }
    try {
      await membershipApi.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch {
      toast.error('Error al marcar como leídas');
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await membershipApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silencioso
    }
  };

  const deleteSingle = async (id: string) => {
    try {
      await membershipApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notificación eliminada');
    } catch {
      toast.error('Error al eliminar notificación');
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    if (!confirm('¿Deseas vaciar toda tu bandeja de notificaciones?')) return;
    try {
      await membershipApi.clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Bandeja de notificaciones vaciada');
    } catch {
      toast.error('Error al vaciar la bandeja');
    }
  };

  const sendTestNotification = async () => {
    setTesting(true);
    try {
      await membershipApi.testNotification();
      toast.success('¡Notificación enviada! Aparecerá en tu bandeja y en tu navegador.');
      await loadNotifications(true);
    } catch {
      toast.error('No se pudo enviar la notificación de prueba');
    } finally {
      setTesting(false);
    }
  };

  // Filtrado reactivo estilo WhatsApp
  const filteredNotifications = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return notifications.filter(n => {
      // Filtro por tipo/estado
      if (typeFilter === 'UNREAD' && n.read) return false;
      if (typeFilter === 'commission' && n.type !== 'commission') return false;
      if (typeFilter === 'payment' && n.type !== 'payment' && n.type !== 'withdrawal') return false;
      if (typeFilter === 'chat' && n.type !== 'chat' && n.type !== 'mention') return false;
      if (typeFilter === 'achievement' && n.type !== 'achievement' && n.type !== 'membership') return false;

      // Filtro por búsqueda
      if (q) {
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchMsg = n.message?.toLowerCase().includes(q);
        const matchType = n.type?.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchType) return false;
      }

      return true;
    });
  }, [notifications, searchTerm, typeFilter]);

  const activePushChannels = [
    user?.pushChat ? 'Menciones' : null,
    user?.pushChatAll ? 'Chat Global' : null,
    user?.pushCommissions ? 'Comisiones' : null,
    user?.pushPayments ? 'Pagos' : null,
  ].filter(Boolean).length;

  const tabs = [
    { id: 'inbox', label: 'Bandeja de Entrada', icon: Bell, count: `${unreadCount > 0 ? `${unreadCount} nuevas` : `${notifications.length}`}`, gradient: 'from-sky-500 to-blue-600' },
    { id: 'push', label: 'Configuración Push', icon: BellRing, count: pushGranted ? 'Activo' : 'Inactivo', gradient: 'from-emerald-500 to-teal-600' },
    { id: 'channels', label: 'Canales y Alertas', icon: Sliders, count: `${activePushChannels}/4`, gradient: 'from-purple-500 to-indigo-600' },
    { id: 'guide', label: 'Guía de Dispositivos', icon: Smartphone, count: 'PWA / Móvil', gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Centro de Notificaciones"
        subtitle="Administra tus avisos en tiempo real, alertas push y canales de suscripción."
        icon={Bell}
      />

      {/* Hero Visual Estilo Cyberpunk / Modern Glow */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-5 sm:p-7 border border-white/10 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold">
                <BellRing className="w-3.5 h-3.5 text-sky-400" />
                <span>Web Push & Alertas Globales</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                pushGranted
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pushGranted ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {pushGranted ? 'Push Activo en Navegador' : 'Push No Vinculado'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Mantente al día con cada <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">venta, comisión y mención</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              Recibe notificaciones instantáneas de tus comisiones ganadas, mensajes de la comunidad y estado de retiros directo en tu pantalla.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={sendTestNotification}
              disabled={testing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Enviando alerta...' : 'Enviar Alerta de Prueba'}</span>
            </button>

            <button
              onClick={() => loadNotifications(false)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar avisos</span>
            </button>
          </div>
        </div>

        {/* 4 Métricas Clave en el Hero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Avisos No Leídos</p>
            <p className="text-base sm:text-xl font-black text-sky-400 mt-0.5">{unreadCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Historial Total</p>
            <p className="text-base sm:text-xl font-black text-white mt-0.5">{notifications.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Canales Activos</p>
            <p className="text-base sm:text-xl font-black text-emerald-400 mt-0.5">{activePushChannels} de 4</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium">Entrega en Tiempo Real</p>
            <p className="text-base sm:text-xl font-black text-indigo-400 mt-0.5">OneSignal Web</p>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation (Touch Scrollable) */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-gray-50/90 dark:bg-dark-900/90 backdrop-blur-md border-y border-gray-200/60 dark:border-dark-700/60">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  active
                    ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-md shadow-black/5 ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-dark-800/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${tab.gradient} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                    : 'bg-gray-200/80 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB 1: BANDEJA DE ENTRADA (INBOX) ─── */}
      {currentTab === 'inbox' && (
        <div className="space-y-5 animate-fade-in">
          {/* Header & Filtros WhatsApp */}
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-sky-500" />
                  <span>Historial de Avisos y Notificaciones</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  {unreadCount > 0 ? `Tienes ${unreadCount} avisos pendientes por leer.` : 'Todas tus notificaciones están al día.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-xs font-bold transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Marcar todas leídas</span>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition-all"
                    title="Vaciar historial de notificaciones"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Buscador en tiempo real estilo WhatsApp */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 dark:border-dark-700">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar avisos por palabra clave, remitente o tipo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-dark-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtros Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                {[
                  { id: 'ALL', label: 'Todas', count: notifications.length },
                  { id: 'UNREAD', label: 'No leídas', count: unreadCount },
                  { id: 'commission', label: 'Comisiones', count: notifications.filter(n => n.type === 'commission').length },
                  { id: 'payment', label: 'Pagos / Retiros', count: notifications.filter(n => n.type === 'payment' || n.type === 'withdrawal').length },
                  { id: 'chat', label: 'Chat', count: notifications.filter(n => n.type === 'chat' || n.type === 'mention').length },
                  { id: 'achievement', label: 'Logros', count: notifications.filter(n => n.type === 'achievement' || n.type === 'membership').length },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setTypeFilter(chip.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      typeFilter === chip.id
                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                    }`}
                  >
                    {chip.label} ({chip.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de Notificaciones */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700">
              <div className="w-10 h-10 rounded-full border-3 border-sky-500/20 border-t-sky-500 animate-spin" />
              <p className="text-xs text-gray-400">Cargando bandeja de entrada...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-3xl border border-gray-100 dark:border-dark-700 p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mx-auto">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">
                {searchTerm ? 'No se encontraron notificaciones' : 'Bandeja de notificaciones vacía'}
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {searchTerm
                  ? `No hay avisos que contengan "${searchTerm}". Intenta con otra palabra clave.`
                  : 'Aparecerán aquí avisos automáticos cuando recibas comisiones, respuestas en el chat o actualizaciones de tus pagos.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-all mt-2"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(n => {
                const meta = typeMeta[n.type] || typeMeta.info;
                const Icon = meta.icon;

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markSingleRead(n.id)}
                    className={`group relative bg-white dark:bg-dark-800 rounded-3xl border transition-all p-4 sm:p-5 flex items-start gap-3.5 hover:shadow-md ${
                      !n.read
                        ? 'border-l-4 border-l-sky-500 border-sky-100 dark:border-sky-900/40 bg-gradient-to-r from-sky-50/40 via-white to-white dark:from-sky-950/15 dark:via-dark-800 dark:to-dark-800'
                        : 'border-gray-200 dark:border-dark-700'
                    }`}
                  >
                    {/* Icono de Categoría con Degradado */}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                            {meta.label}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" title="No leída" />
                          )}
                        </div>

                        <span className="text-[11px] text-gray-400 dark:text-dark-500">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 dark:text-dark-100 leading-snug">
                        {highlightMatch(n.title, searchTerm)}
                      </h4>

                      <p className="text-xs text-gray-600 dark:text-dark-300 leading-relaxed">
                        {highlightMatch(n.message, searchTerm)}
                      </p>

                      {/* Botones de Acción */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                        {meta.linkHref && (
                          <Link
                            to={meta.linkHref}
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            <span>{meta.linkText || 'Ver detalles'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}

                        <div className="flex items-center gap-1 ml-auto opacity-80 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markSingleRead(n.id);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-dark-700 transition-colors"
                              title="Marcar como leída"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSingle(n.id);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-dark-700 transition-colors"
                            title="Eliminar aviso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: CONFIGURACIÓN PUSH ─── */}
      {currentTab === 'push' && (
        <div className="space-y-6 animate-fade-in">
          <PushNotificationsPanel onTestSuccess={() => loadNotifications(true)} />
        </div>
      )}

      {/* ─── TAB 3: CANALES Y ALERTAS ─── */}
      {currentTab === 'channels' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span>Preferencias Detalladas de Notificación</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                Configura individualmente qué tipo de actividad dispara un aviso en tu dispositivo.
              </p>
            </div>

            <div className="pt-2">
              <PushNotificationsPanel onTestSuccess={() => loadNotifications(true)} />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: GUÍA DE DISPOSITIVOS Y PWA ─── */}
      {currentTab === 'guide' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <span>Cómo recibir Notificaciones Push en tu Móvil o PC</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                Sigue estos sencillos pasos para que no te pierdas ninguna venta ni mención en ningún dispositivo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Android */}
              <div className="p-5 rounded-2xl border border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/40 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold">
                  🤖
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-dark-100">Android (Chrome / Edge)</h4>
                <ol className="text-xs text-gray-600 dark:text-dark-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Abre la aplicación en <strong>Google Chrome</strong>.</li>
                  <li>Toca el botón <strong>&quot;Activar Push&quot;</strong> en la pestaña anterior.</li>
                  <li>Cuando el navegador pregunte, selecciona <strong>&quot;Permitir&quot;</strong>.</li>
                  <li>Opcional: toca el menú de Chrome (⋮) y elige <strong>&quot;Instalar Aplicación&quot;</strong>.</li>
                </ol>
              </div>

              {/* iPhone / iPad */}
              <div className="p-5 rounded-2xl border border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/40 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                  🍏
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-dark-100">iPhone / iPad (iOS 16.4+)</h4>
                <ol className="text-xs text-gray-600 dark:text-dark-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Abre la página web en <strong>Safari</strong>.</li>
                  <li>Toca el botón <strong>Compartir</strong> (icono de caja con flecha hacia arriba).</li>
                  <li>Desliza hacia abajo y pulsa <strong>&quot;Agregar a inicio&quot;</strong>.</li>
                  <li>Abre el icono de <strong>Círculo 1</strong> desde tu pantalla de inicio y activa las notificaciones.</li>
                </ol>
              </div>

              {/* PC / Mac */}
              <div className="p-5 rounded-2xl border border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-900/40 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center font-bold">
                  💻
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-dark-100">Computadora (Windows / Mac)</h4>
                <ol className="text-xs text-gray-600 dark:text-dark-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Haz clic en el candado 🔒 al lado izquierdo de la URL.</li>
                  <li>Asegúrate de que <strong>&quot;Notificaciones&quot;</strong> esté en <strong>Permitir</strong>.</li>
                  <li>Verifica que Windows / macOS no tenga activo el modo <strong>&quot;No Molestar&quot;</strong>.</li>
                  <li>Envía una alerta de prueba para confirmar la llegada.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
