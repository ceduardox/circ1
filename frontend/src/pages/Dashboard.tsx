import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { programApi, membershipApi } from '@/services/api';
import { useVipProStore } from '@/store/vipProStore';
import { CountUp } from '@/components/CountUp';
import { PageHeader } from '@/components/ui';
import {
  Flame, Trophy, ChevronRight, Users, BookOpen, Target, CheckCircle,
  Crown, Snowflake, Gem, Footprints, CalendarCheck, PenLine, Brain, Shield, Heart,
  TrendingUp, Sparkles, Zap, ArrowRight, Lock, Check, RefreshCw, Calendar,
  CheckCircle2, Play, Star, ShieldCheck, Award, Layers
} from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, any> = {
  Footprints, CalendarCheck, Flame, Crown, PenLine, Brain, Shield, Heart, Trophy, Gem,
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;
  target: number;
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const { user } = useAuthStore();
  const { status, fetchStatus } = useMembershipStore();
  const [stats, setStats] = useState<any>(null);
  const [currentDay, setCurrentDay] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const { modules, fetchModules } = useVipProStore();
  const [daily, setDaily] = useState<any>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [progressRes, currentDayRes, achievementsRes] = await Promise.all([
        programApi.progress(),
        programApi.currentDay(),
        programApi.achievements(),
      ]);
      setStats(progressRes.data);
      setCurrentDay(currentDayRes.data.day);
      setAchievements(achievementsRes.data.achievements || []);
      setUnlockedCount(achievementsRes.data.unlockedCount || 0);

      fetchModules();
      if (user?.role !== 'ADMIN') {
        fetchStatus();
        membershipApi.dailySummary().then(r => setDaily(r.data)).catch(() => {});
      }
      if (isRefresh) toast.success('Dashboard actualizado');
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (isRefresh) toast.error('Error al sincronizar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.role, fetchModules, fetchStatus]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleUseFreeze = async () => {
    setFreezing(true);
    try {
      const res = await programApi.useFreeze();
      if (res.data.error) {
        toast.error(res.data.error);
      } else {
        toast.success(res.data.message);
        setStats((prev: any) => ({
          ...prev,
          streakFreezes: res.data.streakFreezes,
          streak: (prev?.streak || 0) + 1,
          freezableGap: false,
        }));
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al usar freeze');
    } finally {
      setFreezing(false);
    }
  };

  const completedCount = currentDay?.contents?.filter((c: any) => {
    const progress = stats?.progress?.find((p: any) => p.contentId === c.id);
    return progress?.status === 'COMPLETED';
  }).length || 0;
  const totalItems = currentDay?.contents?.length || 7;
  const dayProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const completedDates = useMemo(() => {
    const set = new Set<string>();
    stats?.progress?.forEach((p: any) => {
      if (p.status === 'COMPLETED' && p.completedAt) {
        const d = new Date(p.completedAt);
        set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return set;
  }, [stats]);

  const getWeekDays = () => {
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return days.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const dayNum = date.getDate();
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const done = completedDates.has(dateKey);
      return { label, dayNum, isToday, isPast, done };
    });
  };

  const tabs = [
    { id: 'overview', label: 'Mi Día & Resumen', icon: CalendarCheck, count: `Día ${currentDay?.dayNumber || 1}`, gradient: 'from-sky-500 to-blue-600' },
    { id: 'growth', label: 'Caminos & VIP Pro', icon: Sparkles, count: `${modules.filter(m => m.completed).length}/${modules.length || 0} pasos`, gradient: 'from-amber-500 to-orange-600' },
    { id: 'achievements', label: 'Logros & Medallas', icon: Trophy, count: `${unlockedCount}/${achievements.length}`, gradient: 'from-purple-500 to-fuchsia-600' },
    { id: 'activity', label: 'Racha & Semana', icon: Flame, count: `${stats?.streak || 0} días`, gradient: 'from-rose-500 to-red-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
            <div className="h-4 w-72 bg-gray-100 dark:bg-dark-700 rounded-xl" />
          </div>
          <div className="h-5 w-40 bg-gray-100 dark:bg-dark-700 rounded-xl" />
        </div>

        {/* Hero skeleton */}
        <div className="h-56 bg-gray-200 dark:bg-dark-700 rounded-3xl" />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content skeleton */}
          <div className="flex-1 space-y-6">
            <div className="h-[220px] bg-gray-200 dark:bg-dark-700 rounded-3xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 dark:bg-dark-700 rounded-3xl" />
              <div className="h-24 bg-gray-200 dark:bg-dark-700 rounded-3xl" />
              <div className="h-24 bg-gray-200 dark:bg-dark-700 rounded-3xl" />
            </div>
            <div className="h-28 bg-gray-200 dark:bg-dark-700 rounded-3xl" />
          </div>

          {/* Sidebar skeleton */}
          <div className="w-full lg:w-80 space-y-4 shrink-0">
            <div className="h-24 bg-gray-200 dark:bg-dark-700 rounded-3xl" />
            <div className="h-44 bg-gray-200 dark:bg-dark-700 rounded-3xl" />
            <div className="h-32 bg-gray-200 dark:bg-dark-700 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Panel Mi Día"
        subtitle="Tu centro diario de progreso, entrenamiento, caminos de crecimiento y logros en Círculo 1."
        icon={CalendarCheck}
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
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{getGreeting()}, {user?.firstName || 'Miembro'} 👋</span>
              </div>

              {user?.role !== 'ADMIN' && status?.pack && (
                <span className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 bg-amber-500/20 border-amber-500/40 text-amber-300">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Plan {status.pack.packType === 1000 ? 'Élite' : 'Estándar'} · ${status.pack.packType.toLocaleString()}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Hoy avanzas un paso más hacia tu <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">libertad financiera</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              {currentDay
                ? `Estás en el Día ${currentDay.dayNumber} (${currentDay.title}). Tienes ${totalItems - completedCount} tareas pendientes para desbloquear tu siguiente meta.`
                : 'Sigue tu entrenamiento diario, activa tus módulos VIP Pro y haz crecer tu equipo en Círculo 1.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            {currentDay && (
              <Link
                to={`/day/${currentDay.dayNumber}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continuar Día {currentDay.dayNumber}</span>
              </Link>
            )}

            <div className="flex items-center gap-2 w-full">
              <Link
                to="/program"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold backdrop-blur transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-300" />
                <span>Ver Programa</span>
              </Link>

              <button
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white backdrop-blur transition-all"
                title="Sincronizar progreso"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Métricas Clave en el Hero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Racha Actual</span>
            </p>
            <p className="text-base sm:text-xl font-black text-orange-400 mt-0.5">
              <CountUp end={stats?.streak || 0} /> <span className="text-xs font-normal text-gray-300">días</span>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>Puntos Acumulados</span>
            </p>
            <p className="text-base sm:text-xl font-black text-sky-400 mt-0.5">
              <CountUp end={stats?.points || 0} /> <span className="text-xs font-normal text-gray-300">pts</span>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Nivel de Rango</span>
            </p>
            <p className="text-base sm:text-xl font-black text-amber-400 mt-0.5">
              Nivel <CountUp end={stats?.level || 1} />
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Progreso de Hoy</span>
            </p>
            <p className="text-base sm:text-xl font-black text-emerald-400 mt-0.5">
              {dayProgress}% <span className="text-xs font-normal text-gray-300">({completedCount}/{totalItems})</span>
            </p>
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

      {/* ─── TAB 1: MI DÍA & RESUMEN PRINCIPAL ─── */}
      {currentTab === 'overview' && (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
          {/* Columna Izquierda: Contenido Principal */}
          <div className="flex-1 space-y-6">
            {/* Hero Card: TU RUTA DE HOY */}
            {currentDay && (
              <div className="relative rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm overflow-hidden min-h-[230px] bg-white dark:bg-dark-800">
                {/* Background image & overlay */}
                <img
                  src="/images/escalera.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-35 dark:opacity-20 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40 dark:from-dark-800/95 dark:via-dark-800/85 dark:to-dark-800/40 pointer-events-none" />

                {/* Content */}
                <div className="relative p-5 sm:p-6 flex flex-col justify-between h-full min-h-[230px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50 text-[11px] font-bold uppercase tracking-wider">
                        <Zap className="w-3 h-3 text-sky-500" />
                        Tu ruta de hoy
                      </span>
                      <span className="text-xs text-gray-400 dark:text-dark-400 font-medium">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-dark-100 mt-2.5">
                      Día {currentDay.dayNumber} · {currentDay.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-400 mt-1 max-w-xl leading-relaxed">
                      Completa las {totalItems} tareas de este día para seguir desbloqueando tu entrenamiento paso a paso.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-5 pt-4 border-t border-gray-100 dark:border-dark-700/60">
                    {/* Circular progress */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0">
                        <svg className="w-18 h-18 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="7"
                            className="text-gray-100 dark:text-dark-700" />
                          <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="7"
                            strokeDasharray={`${2 * Math.PI * 35}`}
                            strokeDashoffset={`${2 * Math.PI * 35 * (1 - dayProgress / 100)}`}
                            strokeLinecap="round"
                            className="text-sky-500 dark:text-sky-400 transition-[stroke-dashoffset] duration-700 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-dark-100">
                            <CountUp end={completedCount} />
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-dark-500 font-medium">de {totalItems}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-dark-100">
                          {dayProgress === 100 ? '¡Día completado!' : `${dayProgress}% completado`}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-dark-400">
                          {dayProgress === 100 ? 'Excelente trabajo por hoy 🎉' : `Faltan ${totalItems - completedCount} tareas`}
                        </p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:ml-auto">
                      <Link
                        to={`/day/${currentDay.dayNumber}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-sky-600/20 active:scale-[0.98]"
                      >
                        <span>Continuar entrenamiento</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>

                      <Link
                        to="/program"
                        className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-dark-200 text-xs font-semibold transition-all"
                      >
                        Ver mapa
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid de 3 Métricas Rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-dark-500">Racha Continua</p>
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100 mt-0.5">
                    <CountUp end={stats?.streak || 0} /> <span className="text-xs font-normal text-gray-400">días</span>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-dark-500">Puntos Totales</p>
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100 mt-0.5">
                    <CountUp end={stats?.points || 0} /> <span className="text-xs font-normal text-gray-400">pts</span>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-dark-500">Nivel de Rango</p>
                  <p className="text-lg font-black text-gray-900 dark:text-dark-100 mt-0.5">
                    Nivel <CountUp end={stats?.level || 1} />
                  </p>
                </div>
              </div>
            </div>

            {/* Boost Activo / Ganancia Diaria */}
            {daily && daily.count > 0 && (
              <Link to="/earnings/daily" className="block rounded-3xl shadow-lg shadow-indigo-500/15 transition-all overflow-hidden group">
                <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-5 text-white relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                          <Crown className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                          <p className="text-[11px] text-violet-200 uppercase tracking-wider font-black">Boost Activo</p>
                          <p className="text-xs text-white/90 font-medium">{(() => {
                            const directActive = (daily as any).directActive ?? 0;
                            const bonusPerRef = (daily as any).bonusPerReferral ?? 0.02;
                            const bonusCap = (daily as any).bonusCap ?? 0.1;
                            const boost = Math.min(directActive * bonusPerRef, bonusCap);
                            return boost > 0 ? `+${boost.toFixed(2)}% por ${directActive} referido${directActive !== 1 ? 's' : ''}` : 'Invita para activar boost';
                          })()}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold">
                        Nv {Math.min(3, Math.floor(((daily as any).directActive ?? 0) / 2) + 1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3.5">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const active = i < ((daily as any).directActive ?? 0);
                        const rUser = (daily as any).referrals?.[i];
                        return (
                          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-transform group-hover:scale-105 ${active ? 'bg-white text-indigo-600 border-white shadow-sm' : 'bg-white/20 text-white/60 border-white/30 border-dashed'}`}>
                            {active && rUser?.avatarUrl ? <img src={rUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : active ? (rUser?.firstName?.[0] || '✓') : '+'}
                          </div>
                        );
                      })}
                      <span className="text-xs text-violet-200 font-semibold ml-1.5">{(daily as any).directActive ?? 0}/5 referidos</span>
                    </div>

                    <div className="flex items-center justify-between mb-2.5 pt-2 border-t border-white/10">
                      <div>
                        <p className="text-xs text-violet-200">Ganancia acumulada</p>
                        <p className="text-lg sm:text-xl font-black">${Number(daily.total || 0).toFixed(2)} <span className="text-xs font-normal text-violet-200">total</span></p>
                      </div>
                      <span className="text-xs font-bold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">
                        Hoy ${Number(daily.today || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-end gap-1.5 h-7 opacity-85">
                      {(daily.last7 || []).map((d: any, i: number) => {
                        const max = Math.max(...(daily.last7 || []).map((x: any) => x.amount), 1);
                        const h = Math.max(4, Math.round(d.amount / max * 24));
                        return <div key={i} className="flex-1 rounded-sm bg-white/50 group-hover:bg-white/70 transition-colors" style={{ height: h }} />;
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Desbloqueo de Ganancia Diaria */}
            {daily && daily.count === 0 && daily.enabled && (daily.directActive ?? 0) === 0 && (() => {
              const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
              const pct = (Number(daily.min || 0) + Number(daily.max || 0)) / 2;
              const bonus = Number(daily.bonusPerReferral ?? 0.02);
              const est = Number(daily.price || 0) * (pct + bonus) / 100;
              return (
                <Link to="/network" className="block bg-gradient-to-br from-white to-gray-50 dark:from-dark-800 dark:to-dark-750 rounded-3xl border-2 border-dashed border-gray-300 dark:border-dark-600 p-6 text-center hover:border-violet-400 hover:from-violet-50/50 hover:to-indigo-50/50 dark:hover:from-violet-900/20 dark:hover:to-indigo-900/20 transition-all group">
                  <div className="w-13 h-13 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-violet-500/20">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-base font-black text-gray-900 dark:text-dark-100">Desbloquea tu Ganancia Diaria</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-1 max-w-md mx-auto">
                    Tu pack <b>{daily.planName || 'actual'} {usd(Number(daily.price || 0))}</b> tiene <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Number(daily.min || 0)}–{Number(daily.max || 0)}%/día</span> — solo falta <b>1 referido activo</b>.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 flex items-center gap-3 text-left max-w-md mx-auto">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-xs shrink-0">
                      +{est.toFixed(2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-dark-100">Si invitas hoy → {usd(est)}/día desde mañana</p>
                      <p className="text-[11px] text-gray-400">Se suma automáticamente a tu saldo retirable</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-2xl bg-violet-600 text-white text-xs font-bold group-hover:bg-violet-700 transition-colors shadow-sm">
                    <span>Ir a Mi Red</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })()}

            {/* Tus Caminos de Crecimiento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Tus Caminos de Crecimiento</span>
                </h3>
                <span className="text-xs text-gray-400 dark:text-dark-500">3 áreas activas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Entrenamiento */}
                <Link to={`/day/${currentDay?.dayNumber || 1}`} className="block group">
                  <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 hover:border-sky-300 dark:hover:border-sky-800 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-sky-500/20">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-dark-100 text-sm">Entrenamiento</p>
                      <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">Día {currentDay?.dayNumber || 1} en curso</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        Continuar
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>

                {/* VIP Pro */}
                <Link to="/vip-pro" className="block group">
                  <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-800 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-amber-500/20">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-dark-100 text-sm">VIP Pro</p>
                      <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">
                        {modules.length > 0 ? `${modules.filter(m => m.completed).length}/${modules.length} completados` : 'TikTok Shop'}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Ver pasos
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>

                {/* Construir Equipo */}
                <Link to="/team" className="block group">
                  <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-dark-100 text-sm">Construir Equipo</p>
                      <p className="text-xs text-gray-500 dark:text-dark-400 truncate mt-0.5">Invita y gana comisiones</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Mi Equipo
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Próximo Logro */}
            {achievements.length > 0 && (() => {
              const next = achievements.find(a => !a.unlockedAt);
              if (!next) return null;
              const pct = next.target > 0 ? Math.round((next.progress / next.target) * 100) : 0;
              return (
                <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wider">Próximo logro</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-dark-100">{next.title}</p>
                        <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">{next.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto">
                      <div className="w-32 hidden sm:block">
                        <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">{pct}% ({next.progress}/{next.target})</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Columna Derecha: Sidebar */}
          <div className="w-full lg:w-80 space-y-4 shrink-0">
            {/* Plan Card */}
            {user?.role !== 'ADMIN' && status?.pack && (
              <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 sm:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 dark:text-dark-100 text-sm">
                      Plan {status.pack.packType === 1000 ? 'Élite' : 'Estándar'} · ${status.pack.packType.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                      {status.pack.baseCreators != null ? `${status.pack.baseCreators} creadores incluidos` : (status.pack.packType === 1000 ? '10 creadores incluidos' : '5 creadores incluidos')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tu Avance Esta Semana */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>Tu Avance Esta Semana</span>
                </h3>
                <span className="text-[11px] text-gray-400">7 días</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center pt-1">
                {getWeekDays().map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-dark-500">{day.label}</span>
                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                      day.done
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : day.isToday
                        ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/30'
                        : day.isPast
                        ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-dark-500'
                        : 'bg-white dark:bg-dark-800 text-gray-300 dark:text-dark-600 border border-gray-200 dark:border-dark-700'
                    }`}>
                      {day.done ? <Check className="w-4 h-4" /> : day.dayNum}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Freeze (Protector de Racha) */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200/80 dark:border-dark-700 shadow-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Snowflake className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-dark-100">
                      {stats?.streakFreezes || 0} protector{stats?.streakFreezes !== 1 ? 'es' : ''}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-dark-500">de racha disponibles</p>
                  </div>
                </div>

                {stats?.freezableGap && stats?.streakFreezes > 0 && (
                  <button
                    onClick={handleUseFreeze}
                    disabled={freezing}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {freezing ? 'Usando...' : 'Usar'}
                  </button>
                )}
              </div>

              {!stats?.streak ? (
                <div className="pt-3 border-t border-gray-100 dark:border-dark-700 space-y-2">
                  <p className="text-[11px] text-gray-400 dark:text-dark-500 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>Completa tu primera tarea de hoy para iniciar tu racha.</span>
                  </p>
                  <Link
                    to={`/day/${currentDay?.dayNumber || 1}`}
                    className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-all"
                  >
                    <span>Empezar hoy</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CAMINOS DE CRECIMIENTO & VIP PRO ─── */}
      {currentTab === 'growth' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* VIP Pro TikTok Shop */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-dark-100">VIP Pro · TikTok Shop</h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 leading-relaxed">
                  Aprende la metodología completa para prospectar creadores, conseguir muestras y generar ventas en TikTok Shop.
                </p>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {modules.filter(m => m.completed).length} de {modules.length} módulos completados
                </div>
              </div>

              <Link
                to="/vip-pro"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              >
                <span>Acceder a VIP Pro</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Construcción de Equipo */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-dark-100">Construir Mi Equipo</h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 leading-relaxed">
                  Comparte tu enlace de afiliado, suma miembros a tu red y desbloquea comisiones directas e indirectas de nivel 1 y nivel 2.
                </p>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Comisiones del 25% (N1) y 5% (N2)
                </div>
              </div>

              <Link
                to="/team"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                <span>Administrar Equipo</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Programa Diario */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-dark-100">Programa de Entrenamiento</h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 leading-relaxed">
                  Ruta formativa estructurada día a día con tareas prácticas, videos paso a paso y audios de mentalidad.
                </p>
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/50 text-xs font-semibold text-sky-700 dark:text-sky-300">
                  Día {currentDay?.dayNumber || 1} en proceso ({dayProgress}%)
                </div>
              </div>

              <Link
                to="/program"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
              >
                <span>Ver Mapa Completo</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: LOGROS & MEDALLAS ─── */}
      {currentTab === 'achievements' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-dark-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Galería de Logros y Medallas</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                  Desbloquea medallas completando días de entrenamiento, sumando rachas y expandiendo tu red.
                </p>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200/50">
                {unlockedCount} de {achievements.length} desbloqueados
              </span>
            </div>

            {achievements.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Trophy className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-600 dark:text-dark-300">No hay logros configurados en este momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievements.map(achievement => {
                  const Icon = iconMap[achievement.icon] || Trophy;
                  const isUnlocked = !!achievement.unlockedAt;
                  const progressPct = achievement.target > 0 ? Math.round((achievement.progress / achievement.target) * 100) : 0;

                  return (
                    <div
                      key={achievement.id}
                      className={`relative rounded-2xl p-4 text-center transition-all ${
                        isUnlocked
                          ? 'bg-gradient-to-b from-purple-50/80 to-white dark:from-purple-950/20 dark:to-dark-800 border border-purple-200 dark:border-purple-800/60 shadow-sm'
                          : 'bg-gray-50 dark:bg-dark-750 border border-gray-200 dark:border-dark-700 opacity-60'
                      }`}
                    >
                      {isUnlocked && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2.5 ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                          : 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-dark-400'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <p className={`text-xs font-bold mb-1 ${isUnlocked ? 'text-gray-900 dark:text-dark-100' : 'text-gray-500 dark:text-dark-400'}`}>
                        {achievement.title}
                      </p>

                      <p className={`text-[11px] leading-snug ${isUnlocked ? 'text-gray-600 dark:text-dark-300' : 'text-gray-400 dark:text-dark-500'}`}>
                        {achievement.description}
                      </p>

                      {!isUnlocked && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400 dark:bg-dark-400 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-dark-500 font-semibold mt-1">
                            {achievement.progress}/{achievement.target} ({progressPct}%)
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: RACHA & ACTIVIDAD SEMANAL ─── */}
      {currentTab === 'activity' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Resumen de Racha */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">Estado de tu Racha</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Mantén tu hábito diario de aprendizaje</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40">
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  <CountUp end={stats?.streak || 0} /> días consecutivos
                </p>
                <p className="text-xs text-gray-600 dark:text-dark-300 mt-1">
                  Cada día que completas tus tareas sumas puntos de rango y mantienes tu fuego encendido.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-500 dark:text-dark-400">Protectores de racha disponibles:</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{stats?.streakFreezes || 0} unidades</span>
              </div>
            </div>

            {/* Calendario Semanal */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-dark-100">Detalle Semanal</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Tu registro de lunes a domingo</p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center pt-2">
                {getWeekDays().map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-gray-50 dark:bg-dark-750 border border-gray-100 dark:border-dark-700">
                    <span className="text-xs font-bold text-gray-500 dark:text-dark-400">{day.label}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      day.done
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : day.isToday
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-gray-400 dark:text-dark-500'
                    }`}>
                      {day.done ? <Check className="w-4 h-4" /> : day.dayNum}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
