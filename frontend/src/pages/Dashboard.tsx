import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { programApi, adminApi } from '@/services/api';
import { useVipProStore } from '@/store/vipProStore';
import {
  Home, Flame, Trophy, Lock, CheckCircle, Play, ChevronRight, Users, BookOpen, Target,
  Clock, BarChart, Footprints, CalendarCheck, Crown, PenLine, Brain, Shield, Heart, Snowflake, Rocket
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

  const statCards = [
    { label: 'Racha actual', value: `${stats?.streak || 0}`, icon: Flame, color: 'text-orange-500', suffix: stats?.streak === 1 ? 'día' : 'días', highlight: (stats?.streak || 0) >= 3 },
    { label: 'Puntos', value: `${stats?.points || 0}`, icon: Target, color: 'text-primary-500', suffix: 'pts' },
    { label: 'Nivel', value: `${stats?.level || 1}`, icon: Trophy, color: 'text-amber-500', suffix: `/ 100` },
  ];

  const adminStats = [
    { label: 'Ejercicios Hechos', value: stats?.stats?.totalCompleted || 0, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Días Completados', value: stats?.stats?.daysCompleted || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Reflexiones', value: stats?.stats?.reflectionCount || 0, icon: PenLine, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Quizzes Aprobados', value: stats?.stats?.quizCount || 0, icon: Brain, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg shadow-primary-600/20">
        <h1 className="text-2xl font-bold">
          Bienvenido, {user?.firstName || 'Admin'}
        </h1>
        <p className="text-primary-100 mt-1">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-primary-200 font-medium mt-1">Volver a empezar tu entrenamiento</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-white dark:bg-dark-800 rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${stat.highlight ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20' : 'border-gray-100 dark:border-dark-700'}`}>
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                <Icon className={`w-5 h-5 ${stat.color} ${stat.highlight ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-400">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-dark-100">
                  {stat.value}
                  {stat.suffix && <span className="text-sm font-normal text-gray-400 dark:text-dark-500 ml-1">{stat.suffix}</span>}
                </p>
              </div>
              {stat.highlight && (
                <div className="ml-auto text-2xl">🔥</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Streak Freeze */}
      {stats?.streakFreezes > 0 || stats?.freezableGap ? (
        <div className={`rounded-2xl border shadow-sm p-4 flex items-center justify-between ${
          stats?.freezableGap
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-white dark:bg-dark-800 border-gray-100 dark:border-dark-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <Snowflake className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-dark-100">
                {stats?.freezableGap
                  ? 'Racha en riesgo — ¡Úsala antes de que se pierda!'
                  : `Streak Freezes: ${stats?.streakFreezes}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                {stats?.freezableGap
                  ? 'Protege tu racha con 1 freeze'
                  : 'Protegen tu racha si falta 1 día'}
              </p>
            </div>
          </div>
          {stats?.freezableGap && stats?.streakFreezes > 0 && (
            <button
              onClick={handleUseFreeze}
              disabled={freezing}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {freezing ? 'Usando...' : `Usar Freeze (${stats?.streakFreezes})`}
            </button>
          )}
        </div>
      ) : null}

      {/* Mi Progreso */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 dark:text-dark-100 mb-3">Mi Progreso</h2>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats?.overallProgress || 0}%</div>
          <div className="flex-1">
            <div className="h-3 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                style={{ width: `${stats?.overallProgress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* VIP Pro */}
      {user?.role !== 'ADMIN' && (
        <Link
          to="/vip-pro"
          className="block group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-600/25 p-5 transition-all group-hover:shadow-xl group-hover:shadow-purple-600/30 group-hover:-translate-y-0.5 animate-pulse-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-gradient-x" />
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold leading-tight flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-300" />
                    VIP Pro
                  </p>
                  <p className="text-xs text-purple-100 mt-0.5">
                    {modules.length > 0
                      ? `${modules.filter(m => m.completed).length}/${modules.length} pasos · Vende en TikTok Shop`
                      : 'Vende en TikTok Shop'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-amber-300">
                  {modules.length > 0 ? Math.round((modules.filter(m => m.completed).length / modules.length) * 100) : 0}%
                </div>
                <ChevronRight className="w-5 h-5 text-purple-200 ml-auto transition-transform group-hover:translate-x-1" />
              </div>
            </div>
            {modules.length > 0 && (
              <div className="relative mt-4">
                <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                    style={{ width: `${(modules.filter(m => m.completed).length / modules.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Link>
      )}

      {/* Día Actual */}
      {currentDay && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Día {currentDay.dayNumber}: {currentDay.title}
                  </h2>
                  <p className="text-primary-100 text-sm mt-1">
                    {completedCount}/{totalItems} completado
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{dayProgress}%</div>
                  <p className="text-primary-100 text-[11px] mt-0.5">
                    {totalItems - completedCount > 0
                      ? `Te faltan ${totalItems - completedCount} ${totalItems - completedCount === 1 ? 'tarea' : 'tareas'}`
                      : '¡Día completado!'}
                  </p>
                </div>
              </div>
            <div className="mt-3">
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dayProgress >= 100
                      ? 'bg-emerald-300 animate-pulse-soft'
                      : 'bg-gradient-to-r from-yellow-300 via-white to-white shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                  }`}
                  style={{ width: `${dayProgress}%` }}
                />
              </div>
              <p className="text-primary-100 text-[11px] mt-2">
                {dayProgress >= 100
                  ? '🎉 ¡Completaste el día! Desbloqueaste el siguiente.'
                  : dayProgress >= 70
                  ? '¡Ya casi! Termina las tareas restantes para desbloquear el siguiente día.'
                  : 'Completa todas las tareas del día para desbloquear el siguiente.'}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {currentDay.contents?.slice(0, 3).map((content: any, i: number) => {
              const contentProgress = stats?.progress?.find((p: any) => p.contentId === content.id);
              const isCompleted = contentProgress?.status === 'COMPLETED';
              const isCurrent = !isCompleted && i === completedCount;
              return (
                <div
                  key={content.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : isCurrent
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                      : 'bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : isCurrent ? (
                    <Play className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400 dark:text-dark-500" />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-emerald-700 dark:text-emerald-300' : isCurrent ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-dark-400'
                    }`}>
                      {i + 1}. {content.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-dark-700 space-y-3">
            <Link
              to={`/day/${currentDay.dayNumber}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium transition-all"
            >
              Continuar Día {currentDay.dayNumber}
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/program"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-700 font-medium transition-all"
            >
              Ver Programa Completo
            </Link>
          </div>
        </div>
      )}

      {/* Logros */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100">Logros</h2>
          <span className="text-sm text-gray-500 dark:text-dark-400">{unlockedCount}/{achievements.length} desbloqueados</span>
        </div>

        {unlockedCount === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-gray-400 dark:text-dark-500" />
            </div>
            <p className="text-gray-500 dark:text-dark-400">Aún no tienes logros. ¡Empieza tu entrenamiento!</p>
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
                      ? 'bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/30 border border-primary-200 dark:border-primary-700'
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
                        <div
                          className="h-full bg-gray-400 dark:bg-dark-500 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
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

      {/* Admin Panel */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-dark-100 mb-4">Panel de Administración</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {adminStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
                  <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-100">{stat.value}</p>
                  <p className="text-xs text-gray-600 dark:text-dark-300 mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
