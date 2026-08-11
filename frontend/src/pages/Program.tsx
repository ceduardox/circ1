import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { programApi } from '@/services/api';
import { ChevronRight, Lock, CheckCircle, BookOpen, Clock } from 'lucide-react';

interface DayOverview {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  totalContents: number;
  completedCount: number;
  totalRequired: number;
  completedRequired: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  contents: { id: string; title: string; type: string; isRequired: boolean }[];
}

export function ProgramPage() {
  const [days, setDays] = useState<DayOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    programApi.getDays()
      .then(({ data }) => setDays(data.days))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center text-gray-400">Cargando programa...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Programa Completo</h1>
        <p className="text-gray-500 mt-2">7 días de neuroentrenamiento para transformar tu vida</p>
      </div>

      <div className="space-y-4">
        {days.map(day => {
          const progress = day.totalContents > 0 ? Math.round((day.completedCount / day.totalContents) * 100) : 0;
          const statusColor = day.isCompleted
            ? 'text-green-600 bg-green-50 border-green-200'
            : day.isUnlocked
            ? 'text-primary-600 bg-primary-50 border-primary-200'
            : 'text-gray-400 bg-gray-50 border-gray-200';

          return (
            <div
              key={day.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                day.isUnlocked
                  ? 'bg-white border-gray-200 hover:shadow-md hover:border-primary-200'
                  : 'bg-gray-50/50 border-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${
                  day.isCompleted
                    ? 'bg-green-100 text-green-700'
                    : day.isUnlocked
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {day.isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : day.isUnlocked ? (
                    day.dayNumber
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{day.title}</h2>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                      {day.isCompleted ? 'Completado' : day.isUnlocked ? 'Disponible' : 'Bloqueado'}
                    </span>
                  </div>
                  {day.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{day.description}</p>
                  )}

                  {/* Progress */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          day.isCompleted ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {day.completedCount}/{day.totalContents}
                    </span>
                  </div>

                  {/* Content list */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {day.contents.map((content, i) => {
                      const contentCompleted = i < day.completedCount;
                      return (
                        <span
                          key={content.id}
                          className={`text-xs px-2 py-1 rounded-lg ${
                            contentCompleted
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {content.title}
                        </span>
                      );
                    })}
                  </div>

                  {/* Action */}
                  {day.isUnlocked ? (
                    <Link
                      to={`/day/${day.dayNumber}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20"
                    >
                      {day.isCompleted ? 'Repasar' : 'Continuar'}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed">
                      <Lock className="w-4 h-4" />
                      Completa el día anterior
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
