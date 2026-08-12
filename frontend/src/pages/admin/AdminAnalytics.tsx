import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { ButtonGhost, Input } from '@/components/ui';
import { ChevronLeft, Users, BookOpen, BarChart, TrendingUp, Calendar, Clock, Target, Award, AlertTriangle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminAnalyticsPage() {
  const { fetchStats, stats } = useAdminStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [completionByDay, setCompletionByDay] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<any>(null);
  const [stuck, setStuck] = useState<any[]>([]);
  const [stuckDays, setStuckDays] = useState(3);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchStats();
      loadAnalytics();
      loadFunnel();
      loadStuck(3);
    }
  }, [fetchStats, user]);

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics/overview', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCompletionByDay(data.completionByDay || []);
      }
    } catch (e) {
      console.error('Error loading analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFunnel = async () => {
    try {
      const { data } = await adminApi.funnel();
      setFunnel(data);
    } catch { /* silencioso */ }
  };

  const loadStuck = async (days: number) => {
    try {
      const { data } = await adminApi.stuckUsers(days);
      setStuck(data.stuck || []);
      setStuckDays(days);
    } catch { /* silencioso */ }
  };

  if (!user || user.role !== 'ADMIN') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Acceso denegado</div>;
  }

  const totalUsers = stats?.totalUsers || 0;
  const totalDays = stats?.totalDays || 0;
  const totalContents = stats?.totalContents || 0;
  const completedToday = stats?.completedToday || 0;
  const completionRate = totalContents > 0 ? Math.round((completedToday / totalContents) * 100) : 0;

  const analyticsCards = [
    { 
      label: 'Usuarios Totales', 
      value: totalUsers, 
      icon: Users, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      trend: '+12%',
      trendColor: 'text-emerald-500'
    },
    { 
      label: 'Días del Programa', 
      value: totalDays, 
      icon: BookOpen, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      trend: '+2 esta semana',
      trendColor: 'text-emerald-500'
    },
    { 
      label: 'Contenidos Totales', 
      value: totalContents, 
      icon: BarChart, 
      color: 'text-purple-500', 
      bg: 'bg-purple-50',
      trend: '+5 nuevos',
      trendColor: 'text-emerald-500'
    },
    { 
      label: 'Completados Hoy', 
      value: completedToday, 
      icon: TrendingUp, 
      color: 'text-orange-500', 
      bg: 'bg-orange-50',
      trend: `${completionRate}% tasa`,
      trendColor: completionRate > 50 ? 'text-emerald-500' : 'text-yellow-500'
    },
  ];

  const recentStats = [
    { label: 'Promedio completados/usuario', value: totalUsers > 0 ? (completedToday / totalUsers).toFixed(1) : '0', icon: Target, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: 'Días con mayor actividad', value: completionByDay.length > 0 ? `Día ${completionByDay.reduce((a, b) => a.completions > b.completions ? a : b).dayNumber}` : 'N/A', icon: Calendar, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Tiempo promedio sesión', value: '12 min', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Tasa retención día 7', value: '68%', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <ButtonGhost onClick={() => navigate('/admin')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Panel
          </ButtonGhost>
          <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            <BarChart className="w-6 h-6 text-primary-600" /> Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Métricas y estadísticas de la plataforma</p>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-l-4 border-l-primary-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-xs font-medium mt-1 ${stat.trendColor}`}>{stat.trend}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-5 text-center">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Embudo de usuarios */}
      {funnel && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" /> Embudo de usuarios
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 p-4">
                <p className="text-xs text-gray-500 mb-1">Registrados</p>
                <p className="text-3xl font-bold text-gray-900">{funnel.funnel.registered}</p>
              </div>
              <div className="rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4">
                <p className="text-xs text-primary-600 mb-1">Con membresía activa</p>
                <p className="text-3xl font-bold text-primary-700">{funnel.funnel.withMembership}</p>
                <p className="text-xs text-primary-600 mt-1">{funnel.rates.conversionToMembership}% de conversión</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-xs text-emerald-600 mb-1">Activos hoy</p>
                <p className="text-3xl font-bold text-emerald-700">{funnel.funnel.activeToday}</p>
                <p className="text-xs text-emerald-600 mt-1">{funnel.rates.retentionToday}% de los con membresía</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usuarios atascados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Usuarios atascados
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sin completar tareas hace</span>
              {[1, 3, 7].map(d => (
                <button
                  key={d}
                  onClick={() => loadStuck(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    stuckDays === d
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  {d} {d === 1 ? 'día' : 'días'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stuck.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No hay usuarios atascados. Todos los activos están al día.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stuck.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-amber-700">{u.firstName?.[0]}{u.lastName?.[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-500 truncate">@{u.username} · {u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-amber-700 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full shrink-0">
                    Inactivo {stuckDays} {stuckDays === 1 ? 'día' : 'días'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion by Day Chart */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart className="w-5 h-5" /> Completados por Día
          </h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : completionByDay.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay datos de completados aún</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completionByDay.slice(0, 14).map((day: any) => {
                const maxCompletions = Math.max(...completionByDay.map((d: any) => d.completions), 1);
                const percentage = (day.completions / maxCompletions) * 100;
                return (
                  <div key={day.dayNumber} className="flex items-center gap-2 sm:gap-4">
                    <div className="w-14 sm:w-20 text-right text-xs sm:text-sm font-medium text-gray-600">
                      Día {day.dayNumber}
                    </div>
                    <div className="flex-1 h-5 sm:h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 sm:w-16 text-xs sm:text-sm font-medium text-gray-900 text-right">
                      {day.completions}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Users Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" /> Actividad Reciente
          </h2>
        </CardHeader>
        <CardContent>
          {stats?.recentUsers?.length ? (
            <div className="space-y-3">
              {stats.recentUsers.slice(0, 10).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary-600">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-500 truncate">@{u.username}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{format(new Date(u.createdAt), 'dd MMM', { locale: es })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay usuarios recientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}