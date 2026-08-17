import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { programApi } from '@/services/api';
import { useVipProStore } from '@/store/vipProStore';
import { CountUp } from '@/components/CountUp';
import {
  Flame, Trophy, ChevronRight, Users, BookOpen, Target, CheckCircle,
  Crown, Snowflake, Gem, Footprints, CalendarCheck, PenLine, Brain, Shield, Heart
} from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, any> = {
  Footprints, CalendarCheck, Flame, Crown, PenLine, Brain, Shield, Heart, Trophy,
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
  const { user } = useAuthStore();
  const { status, fetchStatus } = useMembershipStore();
  const [stats, setStats] = useState<any>(null);
  const [currentDay, setCurrentDay] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const { modules, fetchModules } = useVipProStore();

  useEffect(() => {
    loadDashboard();
    fetchModules();
    if (user?.role !== 'ADMIN') fetchStatus();
  }, []);

  const loadDashboard = async () => {
    try {
      const [progressRes, currentDayRes, achievementsRes] = await Promise.all([
        programApi.progress(),
        programApi.currentDay(),
        programApi.achievements(),
      ]);
      setStats(progressRes.data);
      setCurrentDay(currentDayRes.data.day);
      setAchievements(achievementsRes.data.achievements);
      setUnlockedCount(achievementsRes.data.unlockedCount);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-gray-200 dark:bg-dark-700 rounded-lg" />
            <div className="h-4 w-72 bg-gray-100 dark:bg-dark-700 rounded-lg" />
          </div>
          <div className="h-4 w-40 bg-gray-100 dark:bg-dark-700 rounded-lg" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content skeleton */}
          <div className="flex-1 space-y-6">
            <div className="h-[220px] bg-gray-200 dark:bg-dark-700 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
              <div className="h-20 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
              <div className="h-20 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
            </div>
            <div className="h-24 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
            <div className="h-32 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
          </div>

          {/* Sidebar skeleton */}
          <div className="w-full lg:w-72 space-y-4 shrink-0">
            <div className="h-20 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
            <div className="h-40 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
            <div className="h-28 bg-gray-200 dark:bg-dark-700 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            {getGreeting()}, {user?.firstName || 'Admin'} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-gray-500 dark:text-dark-400 text-sm mt-1">
            Hoy avanzas un paso más hacia tu objetivo.
          </p>
        </div>
        <p className="text-sm text-gray-400 dark:text-dark-500">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Main Layout: Content + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Main Content */}
        <div className="flex-1 space-y-6">
          {/* Hero: TU RUTA DE HOY */}
          {currentDay && (
            <div className="relative rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden min-h-[220px] animate-fade-up" style={{ animationDelay: '80ms' }}>
              {/* Background image */}
              <img
                src="/images/escalera.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/30 dark:from-dark-800/95 dark:via-dark-800/80 dark:to-dark-800/30" />

              {/* Content */}
              <div className="relative p-6 flex flex-col justify-between h-full min-h-[220px]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    Tu ruta de hoy
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-100 mt-2">
                    Día {currentDay.dayNumber} · {currentDay.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">
                    Completa {totalItems} tareas para desbloquear el siguiente día.
                  </p>
                </div>

                <div className="flex items-center gap-6 mt-5">
                  {/* Circular progress */}
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6"
                        className="text-gray-200/80 dark:text-dark-600/80" />
                      <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 35}`}
                        strokeDashoffset={`${2 * Math.PI * 35 * (1 - dayProgress / 100)}`}
                        strokeLinecap="round"
                        className="text-primary-600 dark:text-primary-400 transition-[stroke-dashoffset] duration-700 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-dark-100"><CountUp end={completedCount} /></span>
                      <span className="text-[10px] text-gray-400 dark:text-dark-500">de {totalItems}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex-1">
                    <Link
                      to={`/day/${currentDay.dayNumber}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-all shadow-sm"
                    >
                      Continuar entrenamiento
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/program"
                      className="block mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Ver programa completo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '160ms' }}>
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 dark:text-dark-500">Racha</p>
                <p className="text-lg font-bold text-gray-900 dark:text-dark-100">
                  <CountUp end={stats?.streak || 0} /> <span className="text-xs font-normal text-gray-400 dark:text-dark-500">días</span>
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <Target className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 dark:text-dark-500">Puntos</p>
                <p className="text-lg font-bold text-gray-900 dark:text-dark-100"><CountUp end={stats?.points || 0} /></p>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 dark:text-dark-500">Nivel</p>
                <p className="text-lg font-bold text-gray-900 dark:text-dark-100"><CountUp end={stats?.level || 1} /></p>
              </div>
            </div>
          </div>

          {/* Tus caminos de crecimiento */}
          <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-3">Tus caminos de crecimiento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Entrenamiento */}
              <Link to={`/day/${currentDay?.dayNumber || 1}`} className="block group">
                <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-dark-100 text-sm">Entrenamiento</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Continúa tu programa diario</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-primary-600 dark:text-primary-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                      En progreso
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>

              {/* VIP Pro */}
              <Link to="/vip-pro" className="block group">
                <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-dark-100 text-sm">VIP Pro</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                      {modules.length > 0
                        ? `Activa ${modules.filter(m => m.completed).length}/${modules.length} pasos para vender en TikTok Shop`
                        : 'Activa pasos para vender en TikTok Shop'}
                    </p>
                    {modules.length > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        {modules.filter(m => m.completed).length}/{modules.length} pasos
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>

              {/* Construir Equipo */}
              <Link to="/team" className="block group">
                <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-dark-100 text-sm">Construir equipo</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Invita personas y gana comisiones</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Comenzar
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
            </div>
          </div>

          {/* Próximo logro */}
          {achievements.length > 0 && (() => {
            const next = achievements.find(a => !a.unlockedAt);
            if (!next) return null;
            const pct = next.target > 0 ? Math.round((next.progress / next.target) * 100) : 0;
            return (
              <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 animate-fade-up" style={{ animationDelay: '320ms' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                      <Gem className="w-5 h-5 text-gray-400 dark:text-dark-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 dark:text-dark-500">Próximo logro</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">{next.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 hidden sm:block">
                      <div className="h-1.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-dark-500 whitespace-nowrap">{pct}% · {next.progress}/{next.target}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-500" />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Logros */}
          {achievements.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-dark-100">Logros</h2>
                <span className="text-sm text-gray-500 dark:text-dark-400">{unlockedCount}/{achievements.length} desbloqueados</span>
              </div>

              {unlockedCount === 0 ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-primary-400 dark:text-primary-500" />
                  </div>
                  <p className="text-gray-600 dark:text-dark-300 font-medium">Aún no tienes logros</p>
                  <p className="text-sm text-gray-400 dark:text-dark-500 mt-1">
                    Completa tu primera tarea de hoy y desbloquéalo
                  </p>
                  <Link
                    to={`/day/${currentDay?.dayNumber || 1}`}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-all"
                  >
                    Empezar mi primera tarea
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {achievements.map(achievement => {
                  const Icon = iconMap[achievement.icon] || Trophy;
                  const isUnlocked = !!achievement.unlockedAt;
                  const progressPct = achievement.target > 0 ? Math.round((achievement.progress / achievement.target) * 100) : 0;

                  return (
                    <div
                      key={achievement.id}
                      className={`relative rounded-xl p-4 text-center transition-all ${
                        isUnlocked
                          ? 'bg-primary-50/80 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                          : 'bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 opacity-60'
                      }`}
                    >
                      {isUnlocked && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                        isUnlocked ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300' : 'bg-gray-200 dark:bg-dark-600 text-gray-400 dark:text-dark-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs font-semibold mb-0.5 ${isUnlocked ? 'text-primary-900 dark:text-primary-200' : 'text-gray-500 dark:text-dark-400'}`}>
                        {achievement.title}
                      </p>
                      <p className={`text-[10px] leading-tight ${isUnlocked ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-dark-500'}`}>
                        {achievement.description}
                      </p>
                      {!isUnlocked && (
                        <div className="mt-2">
                          <div className="h-1 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400 dark:bg-dark-500 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <p className="text-[9px] text-gray-400 dark:text-dark-500 mt-1">{achievement.progress}/{achievement.target}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-72 space-y-4 shrink-0">
          {/* Plan Card */}
          {user?.role !== 'ADMIN' && status?.pack && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 animate-fade-up" style={{ animationDelay: '480ms' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-dark-100 text-sm">
                    Plan {status.pack.packType === 1000 ? 'Élite' : 'Estándar'} · ${status.pack.packType.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {status.pack.packType === 1000 ? '10 creadores incluidos' : '5 creadores incluidos'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tu avance esta semana */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 animate-fade-up" style={{ animationDelay: '560ms' }}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-100 mb-3">Tu avance esta semana</h3>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {getWeekDays().map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-400 dark:text-dark-500">{day.label}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    day.done
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : day.isToday
                      ? 'bg-primary-600 text-white shadow-sm'
                      : day.isPast
                      ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-dark-500'
                      : 'bg-white dark:bg-dark-800 text-gray-300 dark:text-dark-600 border border-gray-100 dark:border-dark-700'
                  }`}>
                    {day.done ? <CheckCircle className="w-4 h-4" /> : day.dayNum}
                  </div>
                  {day.done && <span className="sr-only">completado</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Streak Freeze */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-4 animate-fade-up" style={{ animationDelay: '640ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Snowflake className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-100">
                    {stats?.streakFreezes || 0} protector{stats?.streakFreezes !== 1 ? 'es' : ''} de racha
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-dark-500">disponibles</p>
                </div>
              </div>
              {stats?.freezableGap && stats?.streakFreezes > 0 && (
                <button
                  onClick={handleUseFreeze}
                  disabled={freezing}
                  className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {freezing ? 'Usando...' : 'Usar'}
                </button>
              )}
            </div>
            {!stats?.streak ? (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                <p className="text-[11px] text-gray-400 dark:text-dark-500 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-orange-400" />
                  Completa tu primera tarea de hoy y no pierdas tu racha.
                </p>
                <Link
                  to={`/day/${currentDay?.dayNumber || 1}`}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-medium hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all"
                >
                  Empezar hoy
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
