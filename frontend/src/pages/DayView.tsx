import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgramStore } from '@/store/programStore';
import { ContentRenderer } from '@/components/program/ContentRenderer';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { ButtonPrimary, ButtonGhost } from '@/components/ui';
import { ChevronLeft, AlertCircle } from 'lucide-react';

export function DayViewPage() {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const dayNum = parseInt(dayNumber || '1');
  const { fetchDay, progress, completeContent } = useProgramStore();
  const navigate = useNavigate();
  const [day, setDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDay(dayNum).then(d => { setDay(d); setLoading(false); }).catch(() => { setLoading(false); });
  }, [dayNum, fetchDay]);

  const handlePrevious = () => navigate(`/day/${dayNum - 1}`);
  const handleNext = () => navigate(`/day/${dayNum + 1}`);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  if (!day) return <div className="min-h-screen flex items-center justify-center text-gray-400">Día no encontrado</div>;

  const dayProgress = progress.filter(p => p.dayId === day.id);
  const completedRequired = dayProgress.filter(p => p.content.isRequired && p.status === 'COMPLETED').length;
  const totalRequired = day.contents.filter((c: any) => c.isRequired).length;
  const canUnlockNext = completedRequired === totalRequired && totalRequired > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ButtonGhost onClick={handlePrevious} className="shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </ButtonGhost>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight break-words">{day.title}</h1>
          <p className="text-sm text-gray-500">Día {day.dayNumber}</p>
        </div>
      </div>

      {/* Day Card */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary-50 to-transparent p-4 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl sm:text-3xl shrink-0">📅</div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 break-words">{day.title}</h2>
              {day.description && <p className="text-sm text-gray-600 mt-1 break-words">{day.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 rounded-full"
                style={{ width: `${totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
              {completedRequired}/{totalRequired}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {day.contents.map((content: any) => (
            <div key={content.id}>
              <ContentRenderer content={content} dayNumber={day.dayNumber} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <ButtonGhost onClick={handlePrevious} disabled={dayNum <= 1} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </ButtonGhost>
        <ButtonPrimary
          onClick={handleNext}
          disabled={!canUnlockNext || dayNum >= 7}
          className="flex-1"
        >
          Siguiente <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
        </ButtonPrimary>
      </div>

      {/* Blocked Message */}
      {!canUnlockNext && dayNum < 7 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 sm:p-6 text-center">
            <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">Día Bloqueado</h3>
            <p className="text-sm text-gray-600">
              Completa los {totalRequired - completedRequired} ejercicios requeridos para desbloquear el día {dayNum + 1}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
