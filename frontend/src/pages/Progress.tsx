import { useEffect } from 'react';
import { useProgramStore } from '@/store/programStore';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { ButtonGhost } from '@/components/ui';
import { ChevronLeft, CheckCircle, BookOpen, Clock, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function ProgressPage() {
  const { fetchProgress, progress, reflections } = useProgramStore();
  const navigate = useNavigate();

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const daysCompleted = [...new Set(progress.filter(p => p.status === 'COMPLETED').map(p => p.dayId))].length;
  const totalContents = progress.length;
  const completedContents = progress.filter(p => p.status === 'COMPLETED').length;
  const pendingContents = progress.filter(p => p.status === 'PENDING').length;

  const progressByDay = progress.reduce((acc, p) => {
    if (!acc[p.dayId]) acc[p.dayId] = { day: p.day, contents: [] };
    acc[p.dayId].contents.push(p);
    return acc;
  }, {} as Record<string, { day: any; contents: any[] }>);

  const statsCards = [
    { label: 'Días Completados', value: daysCompleted, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Ejercicios Hechos', value: completedContents, icon: BookOpen, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: 'Pendientes', value: pendingContents, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Reflexiones', value: reflections.length, icon: Target, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ButtonGhost onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver
        </ButtonGhost>
        <h1 className="text-2xl font-bold text-gray-900">Mi Progreso</h1>
        <div className="w-20" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-6 text-center">
                <div className={`w-14 h-14 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Progreso por Día
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(progressByDay).map(([dayId, data]) => (
              <div key={dayId} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{data.day.title}</h3>
                  <span className="text-sm text-gray-500">Día {data.day.dayNumber}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.contents.map(p => (
                    <span
                      key={p.id}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {p.content.title} {p.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 inline ml-1" />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {reflections.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Mis Reflexiones
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reflections.slice(0, 10).map(r => (
                <div key={r.id} className="p-4 bg-gray-50 rounded-xl border-l-4 border-primary-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">{r.reflectionType.toLowerCase()}</span>
                    <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: es })}</span>
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-3">{r.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}