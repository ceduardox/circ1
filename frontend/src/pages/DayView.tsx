import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgramStore } from '@/store/programStore';
import { ContentRenderer } from '@/components/program/ContentRenderer';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { ButtonPrimary, ButtonGhost } from '@/components/ui';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

export function DayViewPage() {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const dayNum = parseInt(dayNumber || '1');
  const { fetchDay, progress, completeContent } = useProgramStore();
  const navigate = useNavigate();
  const [day, setDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchDay(dayNum).then(d => { setDay(d); setLoading(false); }).catch(() => { setLoading(false); });
    setCurrentStep(0);
  }, [dayNum, fetchDay]);

  const handlePrevDay = () => navigate(`/day/${dayNum - 1}`);
  const handleNextDay = () => navigate(`/day/${dayNum + 1}`);

  const goNext = useCallback(() => {
    if (day && currentStep < day.contents.length - 1) {
      setCurrentStep(s => s + 1);
    }
  }, [day, currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleContentCompleted = useCallback(() => {
    setTimeout(() => goNext(), 800);
  }, [goNext]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  if (!day) return <div className="min-h-screen flex items-center justify-center text-gray-400">Día no encontrado</div>;

  const contents = day.contents || [];
  const currentContent = contents[currentStep];
  const totalContents = contents.length;

  const dayProgress = progress.filter((p: any) => p.dayId === day.id);
  const completedRequired = dayProgress.filter((p: any) => p.content.isRequired && p.status === 'COMPLETED').length;
  const totalRequired = contents.filter((c: any) => c.isRequired).length;
  const canUnlockNext = completedRequired === totalRequired && totalRequired > 0;

  const completedCount = dayProgress.filter((p: any) => p.status === 'COMPLETED').length;
  const overallProgress = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <ButtonGhost onClick={handlePrevDay} className="shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </ButtonGhost>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight break-words">{day.title}</h1>
          <p className="text-xs sm:text-sm text-gray-500">Día {day.dayNumber}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-600">{completedCount}/{totalContents} completados</span>
          <span className="text-xs sm:text-sm font-medium text-primary-600">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      {totalContents > 1 && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {contents.map((content: any, i: number) => {
            const isCompleted = dayProgress.some((p: any) => p.contentId === content.id && p.status === 'COMPLETED');
            const isCurrent = i === currentStep;
            return (
              <button
                key={content.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline truncate max-w-[80px]">{content.title.slice(0, 12)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Slider */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          {currentContent && (
            <ContentRenderer
              content={currentContent}
              dayNumber={day.dayNumber}
              onCompleted={handleContentCompleted}
            />
          )}
        </div>

        {/* Slider Navigation */}
        {totalContents > 1 && (
          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
            <ButtonGhost onClick={goPrev} disabled={currentStep === 0} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </ButtonGhost>
            <div className="flex items-center gap-1.5">
              {contents.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep ? 'bg-primary-600 w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <ButtonGhost onClick={goNext} disabled={currentStep === totalContents - 1} className="flex-1">
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </ButtonGhost>
          </div>
        )}
      </div>

      {/* Day Navigation */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
        <ButtonGhost onClick={handlePrevDay} disabled={dayNum <= 1} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" /> Día Anterior
        </ButtonGhost>
        <ButtonPrimary
          onClick={handleNextDay}
          disabled={!canUnlockNext || dayNum >= 7}
          className="flex-1"
        >
          Día Siguiente <ChevronRight className="w-4 h-4 ml-1" />
        </ButtonPrimary>
      </div>

      {/* Blocked Message */}
      {!canUnlockNext && dayNum < 7 && (
        <Card className="border-yellow-200 bg-yellow-50 mt-4">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Completa los {totalRequired - completedRequired} ejercicios requeridos para desbloquear el día {dayNum + 1}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
