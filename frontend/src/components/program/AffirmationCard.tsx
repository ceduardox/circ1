import { useState, useEffect } from 'react';
import { ButtonPrimary, ButtonGhost } from '@/components/ui';
import { Volume2, Repeat, CheckCircle, Mic } from 'lucide-react';

interface AffirmationCardProps {
  title: string;
  text: string;
  repeatCount: number;
  instruction?: string;
  onComplete: () => void;
  completed?: boolean;
}

export function AffirmationCard({ title, text, repeatCount, instruction, onComplete, completed }: AffirmationCardProps) {
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleRepeat = () => {
    if (currentRepeat < repeatCount) {
      setCurrentRepeat(c => c + 1);
      speak();
    }
    if (currentRepeat === repeatCount - 1) {
      onComplete();
    }
  };

  useEffect(() => {
    if (completed && currentRepeat < repeatCount) {
      setCurrentRepeat(repeatCount);
    }
  }, [completed]);

  return (
    <div className={`p-4 sm:p-6 rounded-xl border-2 transition-all ${
      completed 
        ? 'bg-green-50 border-green-300' 
        : 'bg-yellow-50 border-yellow-300'
    }`}>
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <span className="text-2xl sm:text-3xl">💪</span>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{title}</h3>
      </div>
      
      {instruction && <p className="text-sm text-gray-600 mb-3 sm:mb-4 break-words">{instruction}</p>}
      
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-3 sm:mb-4 border border-gray-200">
        <p className="text-base sm:text-xl font-medium text-center text-gray-900 leading-relaxed break-words">
          &ldquo;{text}&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-600">Repetición</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: repeatCount }, (_, i) => (
              <div
                key={i}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                  i < currentRepeat
                    ? 'bg-green-500 text-white'
                    : i === currentRepeat
                    ? 'bg-yellow-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i < currentRepeat ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : i + 1}
              </div>
            ))}
          </div>
        </div>
        <ButtonGhost onClick={speak} disabled={speaking} size="sm">
          {speaking ? <Mic className="w-4 h-4 animate-pulse text-green-500" /> : <Volume2 className="w-4 h-4" />}
        </ButtonGhost>
      </div>

      {currentRepeat < repeatCount ? (
        <ButtonPrimary onClick={handleRepeat} className="w-full" disabled={speaking}>
          <Repeat className="w-4 h-4 mr-2" />
          Repetir ({currentRepeat + 1}/{repeatCount})
        </ButtonPrimary>
      ) : (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium text-sm">¡Completado!</span>
        </div>
      )}
    </div>
  );
}
