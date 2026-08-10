import { useState } from 'react';
import { ButtonPrimary, ButtonSecondary, Card, CardContent } from '@/components/ui';
import { CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'text';
  options: string[];
  correct: number | number[];
}

interface QuizComponentProps {
  title: string;
  questions: Question[];
  passingScore?: number;
  onComplete: (score: number, answers: Record<string, any>) => void;
  completed?: boolean;
  initialAnswers?: Record<string, any>;
}

export function QuizComponent({ title, questions, passingScore = 70, onComplete, completed, initialAnswers = {} }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[currentQuestion];
  const isLast = currentQuestion === questions.length - 1;

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (q.type === 'text') {
        if (userAnswer && userAnswer.trim()) correct++;
      } else if (q.type === 'single') {
        if (userAnswer === q.correct) correct++;
      } else if (q.type === 'multiple') {
        const correctSet = new Set(q.correct as number[]);
        const userSet = new Set((userAnswer || []).map((i: number) => i));
        if (correctSet.size === userSet.size && [...correctSet].every(v => userSet.has(v))) correct++;
      }
    });
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);
    return finalScore;
  };

  const handleNext = () => {
    if (isLast) {
      const finalScore = calculateScore();
      setShowResult(true);
      onComplete(finalScore, answers);
    } else {
      setCurrentQuestion(c => c + 1);
    }
  };

  const handlePrev = () => setCurrentQuestion(c => c - 1);

  const renderOptions = () => {
    if (question.type === 'text') {
      return (
        <textarea
          className="w-full min-h-[100px] p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={answers[question.id] || ''}
          onChange={e => handleAnswer(e.target.value)}
          placeholder="Escribe tu respuesta..."
        />
      );
    }

    return (
      <div className="space-y-3">
        {question.options.map((option, i) => {
          const isSelected = question.type === 'single' 
            ? answers[question.id] === i
            : (answers[question.id] || []).includes(i);
          const isCorrect = question.type === 'single'
            ? q.correct === i
            : (q.correct as number[]).includes(i);
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleAnswer(
                question.type === 'single' ? i : [...(answers[question.id] || []), i].filter((v, idx, arr) => arr.indexOf(v) === idx)
              )}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : showResult && isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : showResult && isSelected && !isCorrect
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  question.type === 'single' ? 'border-current' : 'border-current'
                }`}>
                  {isSelected && (
                    <div className={`w-2.5 h-2.5 rounded-full ${question.type === 'single' ? '' : 'rounded-sm'}`} />
                  )}
                </div>
                <span className="text-gray-900 dark:text-gray-100">{option}</span>
                {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const q = question;

  if (showResult) {
    const passed = score >= passingScore;
    return (
      <div className="p-6 rounded-xl border-2 transition-all text-center">
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
          passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          {passed ? <CheckCircle className="w-10 h-10 text-green-500" /> : <XCircle className="w-10 h-10 text-red-500" />}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {passed ? 'Â¡Felicidades!' : 'Sigue practicando'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          PuntuaciÃ³n: <span className="font-bold text-2xl">{score}%</span> (mÃ­nimo {passingScore}%)
        </p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {questions.map((q, i) => {
            const userAnswer = answers[q.id];
            let correct = false;
            if (q.type === 'text') correct = !!userAnswer?.trim();
            else if (q.type === 'single') correct = userAnswer === q.correct;
            else if (q.type === 'multiple') {
              const correctSet = new Set(q.correct as number[]);
              const userSet = new Set((userAnswer || []).map((v: number) => v));
              correct = correctSet.size === userSet.size && [...correctSet].every(v => userSet.has(v));
            }
            return (
              <div className={`p-3 rounded-lg ${correct ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="text-sm font-medium">{correct ? 'âœ“' : 'âœ—'} P{i + 1}</div>
              </div>
            );
          })}
        </div>
        <ButtonPrimary onClick={() => { setShowResult(false); setCurrentQuestion(0); setAnswers({}); }} className="w-full">
          Reintentar Quiz
        </ButtonPrimary>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border-2 bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">ðŸ§ </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Pregunta {currentQuestion + 1} de {questions.length}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-1 mb-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded ${
                i < currentQuestion ? 'bg-green-500' :
                i === currentQuestion ? 'bg-purple-500' :
                'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <p className="text-xl font-medium text-gray-900 dark:text-gray-100">{q.text}</p>
      </div>

      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="p-0">
          {renderOptions()}
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6">
        {currentQuestion > 0 && (
          <ButtonSecondary onClick={handlePrev} className="flex-1">
            Anterior
          </ButtonSecondary>
        )}
        <ButtonPrimary onClick={handleNext} className="flex-1" disabled={!answers[q.id] && q.type !== 'text'}>
          {isLast ? 'Finalizar' : 'Siguiente'}
          <ArrowRight className="w-4 h-4" />
        </ButtonPrimary>
      </div>
    </div>
  );
}