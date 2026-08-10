import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { programApi, adminApi } from '@/services/api';
import {
  Home, Flame, Trophy, Lock, CheckCircle, Play, ChevronRight, Users, BookOpen, Target,
  Clock, BarChart
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [currentDay, setCurrentDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [progressRes, currentDayRes] = await Promise.all([
        programApi.progress(),
        programApi.currentDay(),
      ]);
      setStats(progressRes.data);
      setCurrentDay(currentDayRes.data.day);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = currentDay?.items?.filter((i: any) => i.status === 'COMPLETED').length || 0;
  const totalItems = currentDay?.items?.length || 7;
  const dayProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const statCards = [
    { label: 'Tiempo total', value: `${stats?.totalTime || 0}min`, icon: Clock, color: 'text-blue-500' },
    { label: 'Racha actual', value: `${stats?.streak || 0}días`, icon: Flame, color: 'text-red-400' },
    { label: 'Contenido', value: `${stats?.overallProgress || 0}%`, icon: Target, color: 'text-emerald-500' },
  ];

  const adminStats = [
    { label: 'Total Usuarios', value: '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Programa', value: '110días', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Contenido Total', value: '110', icon: BarChart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Días Completados', value: '0', icon: Target, color: 'text-yellow-600', bg: 'bg-yellow-50' },
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
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mi Progreso */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Mi Progreso</h2>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-primary-600">{stats?.overallProgress || 0}%</div>
          <div className="flex-1">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all"
                style={{ width: `${stats?.overallProgress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Día Actual */}
      {currentDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${dayProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {currentDay.items?.slice(0, 3).map((item: any, i: number) => {
              const isCompleted = item.status === 'COMPLETED';
              const isCurrent = !isCompleted && i === completedCount;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 border border-emerald-200'
                      : isCurrent
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50 border border-gray-200 opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : isCurrent ? (
                    <Play className="w-5 h-5 text-primary-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-emerald-700' : isCurrent ? 'text-primary-700' : 'text-gray-500'
                    }`}>
                      {i + 1}. {item.content?.title || item.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-3">
            <Link
              to={`/day/${currentDay.dayNumber}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium transition-all"
            >
              Continuar Día 1
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/program"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              Ver Programa Completo
            </Link>
          </div>
        </div>
      )}

      {/* Logros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="font-semibold text-gray-900 mb-4">Logros Desbloqueados</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Aún no tienes logros. ¡Empieza tu entrenamiento!</p>
        </div>
      </div>

      {/* Admin Panel */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Panel de Administración</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {adminStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
                  <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}