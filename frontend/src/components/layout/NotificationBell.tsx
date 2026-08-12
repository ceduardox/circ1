import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, CheckCircle2, TrendingUp, Info, Wallet, Crown, UserPlus, Trophy, AtSign } from 'lucide-react';
import { membershipApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const typeIcons: Record<string, { icon: any; classes: string }> = {
  commission: { icon: TrendingUp, classes: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' },
  payment: { icon: CheckCircle2, classes: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' },
  withdrawal: { icon: Wallet, classes: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
  membership: { icon: Crown, classes: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
  referral: { icon: UserPlus, classes: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
  achievement: { icon: Trophy, classes: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' },
  mention: { icon: AtSign, classes: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' },
  info: { icon: Info, classes: 'text-gray-600 dark:text-dark-300 bg-gray-50 dark:bg-dark-700' },
};

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await membershipApi.notifications();
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch { /* silencioso */ }
  }, [user]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markRead = async () => {
    if (unread === 0) return;
    try {
      await membershipApi.markNotificationsRead();
      setNotifications(ns => ns.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silencioso */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markRead(); }}
        className="p-2 rounded-xl text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors relative"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-600 shadow-xl z-50 overflow-hidden animate-enter-up">
          <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-dark-100 text-sm">Notificaciones</p>
            {notifications.length > 0 && (
              <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-dark-200">
                Cerrar
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-dark-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-dark-500">
                No tienes notificaciones todavía.
              </div>
            ) : (
              notifications.map(n => {
                const t = typeIcons[n.type] || typeIcons.info;
                const Icon = t.icon;
                return (
                  <div key={n.id} className={`p-3.5 flex items-start gap-3 border-b border-gray-50 dark:border-dark-700 ${!n.read ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${t.classes}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-dark-100 leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-gray-400 dark:text-dark-500 mt-1">
                        {new Date(n.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}