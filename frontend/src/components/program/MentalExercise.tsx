import { useState, useEffect } from 'react';
import { ButtonPrimary, ButtonGhost } from '@/components/ui';
import { Play, Pause, CheckCircle, Brain, Timer } from 'lucide-react';

interface MentalExerciseProps {
  title: string;
  instruction: string;
  durationMinutes: number;
  steps: string[];
  onComplete: () => void;
  completed?: boolean;
  persistenceKey: string;
}

export function MentalExercise({ title, instruction, durationMinutes, steps, onComplete, completed, persistenceKey }: MentalExerciseProps) {
  const storageKey = `mental-exercise:${persistenceKey}`;
  const readSaved = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null') as { timeLeft?: number; currentStep?: number } | null;
    } catch {
      return null;
    }
  };
  const saved = readSaved();
  const [phase, setPhase] = useState<'idle' | 'running' | 'paused' | 'done'>(completed ? 'done' : saved ? 'paused' : 'idle');
  const [timeLeft, setTimeLeft] = useState(saved?.timeLeft ?? durationMinutes * 60);
  const [currentStep, setCurrentStep] = useState(saved?.currentStep ?? 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'running') {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setPhase('done');
            setCurrentStep(steps.length - 1);
            onComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running') {
      const stepDuration = (durationMinutes * 60) / steps.length;
      const elapsed = durationMinutes * 60 - timeLeft;
      setCurrentStep(Math.min(Math.floor(elapsed / stepDuration), steps.length - 1));
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    if (completed || phase === 'done') {
      localStorage.removeItem(storageKey);
      return;
    }
    if (phase !== 'idle') {
      localStorage.setItem(storageKey, JSON.stringify({ timeLeft, currentStep }));
    }
  }, [completed, currentStep, phase, storageKey, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const toggle = () => setPhase(p => p === 'running' ? 'paused' : 'running');
  const reset = () => { localStorage.removeItem(storageKey); setPhase('idle'); setTimeLeft(durationMinutes * 60); setCurrentStep(0); };

  return (
    <div className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${
      completed 
        ? 'bg-green-50 border-green-300' 
        : 'bg-indigo-50 border-indigo-300'
    }`}>
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <span className="text-2xl sm:text-3xl">🧠</span>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{title}</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4 sm:mb-6 break-words">{instruction}</p>

      <div className="space-y-3 mb-4 sm:mb-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg transition-all ${
              i < currentStep 
                ? 'bg-green-50 border border-green-200' 
                : i === currentStep && phase === 'running'
                ? 'bg-indigo-50 border border-indigo-200 animate-pulse'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium shrink-0 ${
              i < currentStep 
                ? 'bg-green-500 text-white' 
                : i === currentStep && phase === 'running'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {i < currentStep ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : i + 1}
            </div>
            <span className="text-gray-900 text-sm break-words">{step}</span>
          </div>
        ))}
      </div>

      <div className="text-center mb-4 sm:mb-6">
        <div className="text-3xl sm:text-4xl font-mono font-bold text-gray-900 mb-2">
          {formatTime(timeLeft)}
        </div>
        <div className="w-full h-2.5 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000" 
            style={{ width: `${((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {phase === 'idle' && (
          <ButtonPrimary onClick={() => setPhase('running')} className="w-full sm:w-48">
            <Play className="w-4 h-4 mr-2" />
            Iniciar
          </ButtonPrimary>
        )}
        {phase === 'running' && (
          <ButtonGhost onClick={toggle} className="w-full sm:w-48 bg-yellow-500 text-white hover:bg-yellow-600">
            <Pause className="w-4 h-4 mr-2" />
            Pausar
          </ButtonGhost>
        )}
        {phase === 'paused' && (
          <ButtonPrimary onClick={toggle} className="w-full sm:w-48">
            <Play className="w-4 h-4 mr-2" />
            Continuar
          </ButtonPrimary>
        )}
        {phase === 'done' && (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">¡Completado!</span>
          </div>
        )}
        {(phase === 'running' || phase === 'paused') && (
          <ButtonGhost onClick={reset} className="w-full sm:w-auto">
            Reiniciar
          </ButtonGhost>
        )}
      </div>
    </div>
  );
}
