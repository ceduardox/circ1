import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgramStore } from '@/store/programStore';
import { ContentRenderer } from '@/components/program/ContentRenderer';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Lock } from 'lucide-react';

export function DayViewPage() {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const dayNum = parseInt(dayNumber || '1');
  const { fetchDay, progress } = useProgramStore();
  const navigate = useNavigate();
  const [day, setDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchDay(dayNum).then(d => { setDay(d); setLoading(false); }).catch(() => { setLoading(false); });
    setCurrentStep(0);
  }, [dayNum, fetchDay]);

  const handlePrevDay = () => navigate(`/day/${dayNum - 1}`);
  const handleNextDay = () => {
    if (canUnlockNext && dayNum < 7) navigate(`/day/${dayNum + 1}`);
  };

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

  const isContentCompleted = useCallback((contentId: string) => {
    return progress.some((p: any) => p.contentId === contentId && p.status === 'COMPLETED');
  }, [progress]);

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

  const currentContentCompleted = currentContent ? isContentCompleted(currentContent.id) : true;
  const currentIsRequired = currentContent?.isRequired ?? false;
  const canGoNext = currentContentCompleted || !currentIsRequired;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={handlePrevDay}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0 mt-0.5"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{day.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Día {day.dayNumber}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{completedCount}/{totalContents} completados</span>
          <span className="text-sm font-semibold text-primary-600">{overallProgress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      {totalContents > 1 && (
        <div className="flex items-center gap-2.5 mb-5">
          {contents.map((content: any, i: number) => {
            const isCompleted = isContentCompleted(content.id);
            const isCurrent = i === currentStep;
            return (
              <button
                key={content.id}
                onClick={() => setCurrentStep(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110'
                    : isCompleted
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          {currentContent && (
            <div key={currentContent.id} className="animate-enter-up">
              <ContentRenderer
                content={currentContent}
                dayNumber={day.dayNumber}
                onCompleted={handleContentCompleted}
              />
            </div>
          )}
        </div>

        {/* Warning if current required content not completed */}
        {currentIsRequired && !currentContentCompleted && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              Debes completar este ejercicio antes de continuar al siguiente.
            </p>
          </div>
        )}

        {/* Slider Navigation */}
        {totalContents > 1 && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="min-w-0 flex items-center justify-center gap-2 px-3 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed sm:px-5"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <div className="order-3 col-span-2 flex min-w-0 items-center justify-center gap-2 overflow-hidden sm:order-none sm:col-auto">
              {contents.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === currentStep
                      ? 'w-6 h-2 bg-primary-600'
                      : 'w-2 h-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              disabled={currentStep === totalContents - 1 || !canGoNext}
              className="min-w-0 flex items-center justify-center gap-2 px-3 py-2.5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary-500/20 sm:px-5"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Day Navigation */}
      <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
        <button
          onClick={handlePrevDay}
          disabled={dayNum <= 1}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Día Anterior
        </button>
        <button
          onClick={handleNextDay}
          disabled={!canUnlockNext || dayNum >= 7}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
        >
          {canUnlockNext ? (
            <>
              Día Siguiente
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Completa todos los ejercicios
            </>
          )}
        </button>
      </div>

      {/* Blocked Message */}
      {!canUnlockNext && dayNum < 7 && (
        <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Completa los {totalRequired - completedRequired} ejercicios requeridos para desbloquear el día {dayNum + 1}.
          </p>
        </div>
      )}
    </div>
  );
}
