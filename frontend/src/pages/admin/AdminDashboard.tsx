import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { ButtonPrimary, ButtonGhost } from '@/components/ui';
import { Plus, Users, BookOpen, BarChart, Crown, CheckCircle, Edit } from 'lucide-react';

export function AdminDashboardPage() {
  const { fetchStats, stats } = useAdminStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!user || user.role !== 'ADMIN') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Acceso denegado</div>;
  }

  const adminStats = [
    { label: 'Usuarios Totales', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Días del Programa', value: stats?.totalDays || 0, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Contenidos Totales', value: stats?.totalContents || 0, icon: BarChart, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Completados Hoy', value: stats?.completedToday || 0, icon: CheckCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" /> Panel de Administración
          </h1>
          <p className="text-gray-500">Gestiona la comunidad y el programa</p>
        </div>
        <Link to="/admin/days" className="shrink-0">
          <ButtonPrimary><Plus className="w-4 h-4 mr-2" /> Nuevo Día</ButtonPrimary>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-500 text-sm truncate">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Gestión de Días
              </h2>
              <Link to="/admin/days">
                <ButtonGhost size="sm">Ver todos</ButtonGhost>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats && stats.recentDays?.slice(0, 5).map((day: any) => (
                <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">Día {day.dayNumber}: {day.title}</p>
                    <p className="text-sm text-gray-500">{day.contents?.length || 0} contenidos</p>
                  </div>
                  <Link to={`/admin/days/${day.id}`} className="shrink-0">
                    <ButtonGhost size="sm"><Edit className="w-4 h-4" /></ButtonGhost>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" /> Últimos Usuarios
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentUsers?.slice(0, 5).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary-600">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-500">@{u.username}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/admin/days"><ButtonPrimary><Plus className="w-4 h-4 mr-2" /> Crear Día</ButtonPrimary></Link>
        <Link to="/admin/users"><ButtonGhost><Users className="w-4 h-4 mr-2" /> Gestionar Usuarios</ButtonGhost></Link>
        <Link to="/admin/analytics"><ButtonGhost><BarChart className="w-4 h-4 mr-2" /> Ver Analytics</ButtonGhost></Link>
      </div>
    </div>
  );
}