import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui';
import { ButtonPrimary } from '@/components/ui';
import { CheckCircle, RotateCcw, GripVertical, ArrowRight, Star } from 'lucide-react';

interface InteractiveExerciseProps {
  title: string;
  onComplete: () => void;
  completed: boolean;
  exercise: {
    type: 'matching' | 'ordering' | 'scenarios' | 'fill_blanks' | 'scale' | 'puzzle';
    instruction: string;
    data: any;
  };
}

// ═══════════════════════════════════════════════════════════
// MATCHING: Conectar pares (ej: objeción → respuesta)
// ═══════════════════════════════════════════════════════════
function MatchingExercise({ data, onComplete }: { data: any; onComplete: () => void }) {
  const { pairs } = data;
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [wrongPair, setWrongPair] = useState<number | null>(null);
  const [justMatched, setJustMatched] = useState<number | null>(null);

  const shuffledRight = useState(() => {
    const indices = pairs.map((_: any, i: number) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  })[0];

  const handleLeftClick = (index: number) => {
    if (showResults) return;
    setSelectedLeft(index);
    setWrongPair(null);
  };

  const handleRightClick = (shuffledIndex: number) => {
    if (showResults || selectedLeft === null) return;
    const newMatches = { ...matches };
    // Remove any existing match for this left or right
    Object.keys(newMatches).forEach(k => {
      if (newMatches[Number(k)] === shuffledIndex) delete newMatches[Number(k)];
    });
    newMatches[selectedLeft] = shuffledIndex;
    setMatches(newMatches);
    setSelectedLeft(null);

    // Animate: correct pair pops, wrong pair shakes
    if (selectedLeft === shuffledIndex) {
      setJustMatched(selectedLeft);
      setTimeout(() => setJustMatched(null), 500);
    } else {
      setWrongPair(selectedLeft);
      setTimeout(() => setWrongPair(null), 500);
    }
  };

  const checkAnswers = () => {
    setShowResults(true);
    const allCorrect = pairs.every((_: any, i: number) => matches[i] === i);
    if (allCorrect) onComplete();
  };

  const reset = () => { setMatches({}); setSelectedLeft(null); setShowResults(false); setWrongPair(null); setJustMatched(null); };

  const allMatched = Object.keys(matches).length === pairs.length;

  const getLeftClass = (i: number) => {
    if (wrongPair === i) return 'border-red-400 bg-red-50 text-red-700 animate-shake';
    if (selectedLeft === i) return 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-[1.02] animate-pulse-soft';
    if (matches[i] !== undefined) {
      if (showResults) return matches[i] === i
        ? 'border-green-400 bg-green-50 text-green-700 animate-pop-correct'
        : 'border-red-400 bg-red-50 text-red-700';
      return 'border-primary-300 bg-primary-50/50 text-primary-600';
    }
    return 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Objeciones</p>
          {pairs.map((pair: any, i: number) => (
            <button
              key={i}
              onClick={() => handleLeftClick(i)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium cursor-pointer ${getLeftClass(i)}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <span>{pair.left}</span>
                {justMatched === i && <CheckCircle className="w-5 h-5 text-green-500 ml-auto animate-pop-correct" />}
              </div>
            </button>
          ))}
        </div>
        {/* Right column */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Respuestas</p>
          {shuffledRight.map((shuffledIdx: number, displayIdx: number) => {
            const pair = pairs[shuffledIdx];
            const matchedBy = Object.entries(matches).find(([_, v]) => v === shuffledIdx);
            const isJustMatched = justMatched === shuffledIdx;
            return (
              <button
                key={shuffledIdx}
                onClick={() => handleRightClick(shuffledIdx)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium cursor-pointer ${
                  selectedLeft !== null
                    ? 'border-primary-300 bg-primary-50/30 hover:border-primary-400 hover:bg-primary-50/60 active:scale-[0.98]'
                    : matchedBy
                    ? showResults
                      ? Number(matchedBy[0]) === shuffledIdx
                        ? 'border-green-400 bg-green-50 text-green-700 animate-pop-correct'
                        : 'border-red-400 bg-red-50 text-red-700'
                      : 'border-primary-300 bg-primary-50/50 text-primary-600'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]'
                } ${isJustMatched ? 'animate-pop-correct' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {matchedBy && <CheckCircle className="w-4 h-4 shrink-0 text-primary-500" />}
                  <span>{pair.right}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        {!showResults && allMatched && (
          <ButtonPrimary onClick={checkAnswers} className="animate-pulse-soft">Verificar Respuestas</ButtonPrimary>
        )}
        {showResults && (
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <RotateCcw className="w-4 h-4" /> Intentar de Nuevo
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ORDERING: Ordenar pasos (ej: proceso de venta)
// ═══════════════════════════════════════════════════════════
function OrderingExercise({ data, onComplete }: { data: any; onComplete: () => void }) {
  const { items } = data;
  const [currentOrder, setCurrentOrder] = useState(() => {
    const indices = items.map((_: any, i: number) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });
  const [showResults, setShowResults] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const moveItem = (from: number, to: number) => {
    if (showResults || from === to) return;
    const newOrder = [...currentOrder];
    const [item] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, item);
    setCurrentOrder(newOrder);
  };

  const checkAnswers = () => {
    setShowResults(true);
    const allCorrect = currentOrder.every((idx: number, pos: number) => idx === pos);
    if (allCorrect) onComplete();
  };

  const reset = () => {
    const indices = items.map((_: any, i: number) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setCurrentOrder(indices);
    setShowResults(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Arrastra para ordenar (arriba = primer paso)</p>
      {currentOrder.map((originalIdx: number, position: number) => {
        const item = items[originalIdx];
        const isCorrect = showResults && originalIdx === position;
        const isWrong = showResults && originalIdx !== position;
        return (
          <div
            key={`${originalIdx}-${position}`}
            draggable={!showResults}
            onDragStart={() => setDragIdx(position)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) { moveItem(dragIdx, position); setDragIdx(null); } }}
            onDragEnd={() => setDragIdx(null)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              isCorrect ? 'border-green-400 bg-green-50' : isWrong ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
            } ${!showResults ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {!showResults && <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />}
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              isCorrect ? 'bg-green-100 text-green-700' : isWrong ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
            }`}>{position + 1}</span>
            <span className="text-sm text-gray-700 flex-1">{item}</span>
            {!showResults && (
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveItem(position, Math.max(0, position - 1))} className="text-gray-400 hover:text-gray-600 text-xs" disabled={position === 0}>▲</button>
                <button onClick={() => moveItem(position, Math.min(items.length - 1, position + 1))} className="text-gray-400 hover:text-gray-600 text-xs" disabled={position === items.length - 1}>▼</button>
              </div>
            )}
            {showResults && isWrong && (
              <span className="text-xs text-red-500">Debería ser #{originalIdx + 1}</span>
            )}
          </div>
        );
      })}
      <div className="flex gap-3 justify-center pt-2">
        {!showResults && (
          <ButtonPrimary onClick={checkAnswers}>Verificar Orden</ButtonPrimary>
        )}
        {showResults && (
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <RotateCcw className="w-4 h-4" /> Intentar de Nuevo
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCENARIOS: Escenarios de venta con opciones
// ═══════════════════════════════════════════════════════════
function ScenariosExercise({ data, onComplete }: { data: any; onComplete: () => void }) {
  const { scenarios } = data;
  const [currentScenario, setCurrentScenario] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const scenario = scenarios[currentScenario];
  const selectedAnswer = answers[currentScenario];
  const isCorrect = selectedAnswer === scenario.correct;

  const handleAnswer = (optionIndex: number) => {
    if (showFeedback) return;
    setAnswers({ ...answers, [currentScenario]: optionIndex });
    setShowFeedback(true);
  };

  const nextScenario = () => {
    setShowFeedback(false);
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      if (currentScenario < scenarios.length - 1) {
        setCurrentScenario(currentScenario + 1);
      } else {
        const totalCorrect = scenarios.filter((s: any, i: number) => answers[i] === s.correct).length;
        if (totalCorrect >= Math.ceil(scenarios.length * 0.7)) onComplete();
      }
    }, 250);
  };

  const reset = () => { setCurrentScenario(0); setAnswers({}); setShowFeedback(false); setTransitioning(false); };

  const allDone = currentScenario === scenarios.length - 1 && showFeedback;
  const totalCorrect = scenarios.filter((s: any, i: number) => answers[i] === s.correct).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {scenarios.map((_: any, i: number) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            i < currentScenario ? (answers[i] === scenarios[i].correct ? 'bg-green-400' : 'bg-red-400') :
            i === currentScenario ? 'bg-primary-500' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      <div className={transitioning ? 'animate-enter-up opacity-0' : 'animate-enter-up'}>
      <p className="text-xs font-semibold text-gray-400">Escenario {currentScenario + 1} de {scenarios.length}</p>

      <div className={`p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border border-primary-200 mt-3 ${isCorrect && showFeedback ? 'animate-pop-correct' : ''} ${showFeedback && !isCorrect ? 'animate-shake' : ''}`}>
        <p className="text-sm font-medium text-primary-900 leading-relaxed">{scenario.situation}</p>
      </div>

      <div className="space-y-2 mt-3">
        {scenario.options.map((option: string, i: number) => {
          const isSelected = selectedAnswer === i;
          const isOptionCorrect = i === scenario.correct;
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={showFeedback}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${
                showFeedback
                  ? isOptionCorrect
                    ? 'border-green-400 bg-green-50 text-green-800'
                    : isSelected && !isOptionCorrect
                    ? 'border-red-400 bg-red-50 text-red-800'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                  : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/30 text-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  showFeedback && isOptionCorrect ? 'bg-green-100 text-green-700' :
                  showFeedback && isSelected ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{String.fromCharCode(65 + i)}</span>
                <span>{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className={`p-3 rounded-xl text-sm ${isCorrect ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
          {isCorrect ? '✅ ¡Correcto! ' : '💡 Incorrecto. '}{scenario.explanation}
        </div>
      )}

      {showFeedback && (
        <div className="flex justify-center">
          <button onClick={nextScenario} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all">
            {allDone ? `Ver Resultado (${totalCorrect}/${scenarios.length})` : 'Siguiente Escenario'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {allDone && (
        <div className="text-center pt-2">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 mx-auto">
            <RotateCcw className="w-4 h-4" /> Repetir
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FILL_BLANKS: Completar frases de ventas
// ═══════════════════════════════════════════════════════════
function FillBlanksExercise({ data, onComplete }: { data: any; onComplete: () => void }) {
  const { sentences } = data;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const checkAnswers = () => {
    setShowResults(true);
    const allCorrect = sentences.every((s: any) =>
      answers[s.id]?.toLowerCase().trim() === s.answer.toLowerCase().trim()
    );
    if (allCorrect) onComplete();
  };

  const reset = () => { setAnswers({}); setShowResults(false); };

  const allFilled = sentences.every((s: any) => answers[s.id]?.trim());

  return (
    <div className="space-y-4">
      {sentences.map((sentence: any, i: number) => {
        const parts = sentence.text.split('___');
        const userAnswer = answers[sentence.id] || '';
        const isCorrect = showResults && userAnswer.toLowerCase().trim() === sentence.answer.toLowerCase().trim();
        const isWrong = showResults && !isCorrect && userAnswer.trim();
        return (
          <div key={sentence.id} className={`p-3 rounded-xl border-2 transition-all ${
            isCorrect ? 'border-green-400 bg-green-50' : isWrong ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-1 flex-wrap text-sm">
              <span className="font-semibold text-gray-800">{i + 1}.</span>
              {parts.map((part: string, pi: number) => (
                <span key={pi} className="flex items-center gap-1">
                  <span className="text-gray-700">{part}</span>
                  {pi < parts.length - 1 && (
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={e => setAnswers({ ...answers, [sentence.id]: e.target.value })}
                      disabled={showResults}
                      placeholder="___"
                      className={`w-32 px-2 py-1 rounded-lg border text-sm font-medium text-center transition-all ${
                        isCorrect ? 'border-green-400 bg-green-100 text-green-700' :
                        isWrong ? 'border-red-400 bg-red-100 text-red-700' :
                        'border-primary-300 bg-primary-50/50 text-primary-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                      }`}
                    />
                  )}
                </span>
              ))}
            </div>
            {showResults && isWrong && (
              <p className="text-xs text-green-600 mt-1 ml-6">Respuesta: <span className="font-semibold">{sentence.answer}</span></p>
            )}
          </div>
        );
      })}
      <div className="flex gap-3 justify-center pt-2">
        {!showResults && allFilled && (
          <ButtonPrimary onClick={checkAnswers}>Verificar</ButtonPrimary>
        )}
        {showResults && (
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <RotateCcw className="w-4 h-4" /> Intentar de Nuevo
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCALE: Autoevaluación visual
// ═══════════════════════════════════════════════════════════
function ScaleExercise({ data, onComplete }: { data: any; onComplete: () => void }) {
  const { questions } = data;
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleRate = (id: string, value: number) => {
    setAnswers({ ...answers, [id]: value });
  };

  const allRated = questions.every((q: any) => answers[q.id] !== undefined);
  const ratedCount = questions.filter((q: any) => answers[q.id] !== undefined).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${(ratedCount / questions.length) * 100}%` }} />
        </div>
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">{ratedCount}/{questions.length}</span>
      </div>
      {questions.map((q: any, qi: number) => (
        <div key={q.id} className={`p-4 bg-white rounded-xl border border-gray-200 animate-enter-up ${answers[q.id] !== undefined ? 'border-primary-200' : ''}`} style={{ animationDelay: `${qi * 0.08}s` }}>
          <p className="text-sm font-medium text-gray-800 mb-3">{q.question}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{q.lowLabel || '1'}</span>
            <div className="flex gap-1 flex-1 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                <button
                  key={val}
                  onClick={() => handleRate(q.id, val)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                    answers[q.id] === val
                      ? val <= 3 ? 'bg-red-500 text-white scale-110 shadow-md animate-pop-correct' :
                        val <= 6 ? 'bg-amber-500 text-white scale-110 shadow-md animate-pop-correct' :
                        'bg-green-500 text-white scale-110 shadow-md animate-pop-correct'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-110 hover:shadow active:scale-95'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400">{q.highLabel || '10'}</span>
          </div>
          {answers[q.id] !== undefined && (
            <p className={`text-xs text-center mt-2 font-semibold animate-pop-correct ${
              answers[q.id] <= 3 ? 'text-red-500' : answers[q.id] <= 6 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {q.labels ? q.labels[answers[q.id] - 1] || '' : ''}
            </p>
          )}
        </div>
      ))}
      {allRated && (
        <div className="flex justify-center pt-2">
          <ButtonPrimary onClick={onComplete} className="animate-pulse-soft">Completar Autoevaluación</ButtonPrimary>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PUZZLE: Completar concepto arrastrando piezas
// ═══════════════════════════════════════════════════════════
function PuzzleExercise({ data, onComplete }: { data: any; onComplete: () => void }) {
  const { pieces, slots } = data;
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [lastPlaced, setLastPlaced] = useState<number | null>(null);
  const [wrongPlace, setWrongPlace] = useState<number | null>(null);

  const handlePieceClick = (pieceIdx: number) => {
    if (showResults) return;
    setSelectedPiece(pieceIdx);
    setWrongPlace(null);
  };

  const handleSlotClick = (slotIdx: number) => {
    if (showResults || selectedPiece === null) return;
    const newPlaced = { ...placed };
    // Remove any piece already in this slot
    Object.keys(newPlaced).forEach(k => { if (newPlaced[Number(k)] === slotIdx) delete newPlaced[Number(k)]; });
    newPlaced[selectedPiece] = slotIdx;
    setPlaced(newPlaced);
    if (selectedPiece === slotIdx) {
      setLastPlaced(selectedPiece);
      setTimeout(() => setLastPlaced(null), 600);
    } else {
      setWrongPlace(slotIdx);
      setTimeout(() => setWrongPlace(null), 600);
    }
    setSelectedPiece(null);
  };

  const usedPieces = Object.keys(placed).map(Number);
  const unusedPieces = pieces.map((_: any, i: number) => i).filter((i: number) => !usedPieces.includes(i));

  const checkAnswers = () => {
    setShowResults(true);
    const allCorrect = pieces.every((_: any, i: number) => placed[i] === i);
    if (allCorrect) onComplete();
  };

  const reset = () => { setPlaced({}); setSelectedPiece(null); setShowResults(false); setLastPlaced(null); setWrongPlace(null); };

  const allPlaced = unusedPieces.length === 0;

  return (
    <div className="space-y-4">
      {/* Pieces pool */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Piezas disponibles</p>
        <div className="flex flex-wrap gap-2">
          {pieces.map((piece: string, i: number) => {
            const isUsed = usedPieces.includes(i);
            const isSelected = selectedPiece === i;
            return (
              <button
                key={i}
                onClick={() => handlePieceClick(i)}
                disabled={isUsed || showResults}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-105' :
                  isUsed ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' :
                  'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95'
                }`}
              >
                {piece}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Completar concepto</p>
        {slots.map((slot: string, i: number) => {
          const placedPiece = Object.entries(placed).find(([_, v]) => v === i);
          const pieceIdx = placedPiece ? Number(placedPiece[0]) : null;
          const isCorrect = showResults && pieceIdx === i;
          const isWrong = showResults && pieceIdx !== null && pieceIdx !== i;
          return (
            <div key={i} className={`flex items-center gap-2 text-sm ${wrongPlace === i ? 'animate-shake' : ''}`}>
              <span className="text-gray-500 w-5 text-right">{i + 1}.</span>
              <span className="text-gray-700">{slot.split('___')[0]}</span>
              <button
                onClick={() => handleSlotClick(i)}
                disabled={showResults}
                className={`min-w-[100px] px-3 py-1.5 rounded-lg border-2 text-center font-medium transition-all duration-200 ${
                  selectedPiece !== null && !showResults ? 'border-primary-400 border-dashed bg-primary-50/30 cursor-pointer animate-pulse-soft' :
                  lastPlaced !== null && pieceIdx === lastPlaced ? 'border-green-400 bg-green-50 text-green-700 animate-pop-correct' :
                  isCorrect ? 'border-green-400 bg-green-50 text-green-700' :
                  isWrong ? 'border-red-400 bg-red-50 text-red-700' :
                  pieceIdx !== null ? 'border-primary-300 bg-primary-50 text-primary-700' :
                  'border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-primary-300'
                }`}
              >
                {pieceIdx !== null ? pieces[pieceIdx] : '?'}
              </button>
              <span className="text-gray-700">{slot.split('___')[1] || ''}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center pt-2">
        {!showResults && allPlaced && (
          <ButtonPrimary onClick={checkAnswers}>Verificar</ButtonPrimary>
        )}
        {showResults && (
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <RotateCcw className="w-4 h-4" /> Intentar de Nuevo
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export function InteractiveExercise({ title, onComplete, completed, exercise }: InteractiveExerciseProps) {
  const renderExercise = () => {
    switch (exercise.type) {
      case 'matching': return <MatchingExercise data={exercise.data} onComplete={onComplete} />;
      case 'ordering': return <OrderingExercise data={exercise.data} onComplete={onComplete} />;
      case 'scenarios': return <ScenariosExercise data={exercise.data} onComplete={onComplete} />;
      case 'fill_blanks': return <FillBlanksExercise data={exercise.data} onComplete={onComplete} />;
      case 'scale': return <ScaleExercise data={exercise.data} onComplete={onComplete} />;
      case 'puzzle': return <PuzzleExercise data={exercise.data} onComplete={onComplete} />;
      default: return <p className="text-gray-500">Tipo de ejercicio no soportado</p>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{exercise.instruction}</p>
        </div>
      </div>
      {completed && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-green-700 text-sm font-medium">
          <CheckCircle className="w-5 h-5" /> Ejercicio completado
        </div>
      )}
      {renderExercise()}
    </div>
  );
}
