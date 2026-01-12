import React, { useState, useEffect } from 'react';
import { Star, Check, X, ArrowRight, RotateCw, Layers, Puzzle, PenTool, HelpCircle } from 'lucide-react';
import { Level, Flashcard, MatchingPair } from '../types';
import { RichTextRenderer } from './Shared';

interface GameplayViewProps {
  level: Level;
  onComplete: (correct: boolean) => void;
}

export const GameplayView: React.FC<GameplayViewProps> = ({ level, onComplete }) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <Header level={level} />
      
      <div className="mt-8">
        {level.type === 'quiz' && <QuizGame level={level} onComplete={onComplete} />}
        {level.type === 'flashcards' && <FlashcardGame level={level} onComplete={onComplete} />}
        {level.type === 'matching' && <MatchingGame level={level} onComplete={onComplete} />}
        {level.type === 'fill_blank' && <FillBlankGame level={level} onComplete={onComplete} />}
      </div>
    </div>
  );
};

// --- Sub Components ---

const Header: React.FC<{ level: Level }> = ({ level }) => {
  const getIcon = () => {
    switch(level.type) {
      case 'flashcards': return Layers;
      case 'matching': return Puzzle;
      case 'fill_blank': return PenTool;
      default: return HelpCircle;
    }
  };
  const Icon = getIcon();

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Icon className="w-6 h-6 text-purple-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">{level.title}</h2>
        </div>
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="text-white font-bold">{level.points} pts</span>
        </div>
      </div>
      
      {level.challenge && (
        <div className="bg-black/20 p-4 rounded-xl border-l-4 border-yellow-400">
          <p className="text-purple-200 font-medium uppercase text-xs tracking-wider mb-1">Mission</p>
          <div className="text-white italic">
            <RichTextRenderer content={level.challenge} />
          </div>
        </div>
      )}
    </div>
  );
};

// 1. Quiz Game
const QuizGame: React.FC<{ level: Level, onComplete: (c: boolean) => void }> = ({ level, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setShowResult(true);
    setTimeout(() => {
      const correct = level.options?.find(o => o.id === selectedAnswer)?.correct || false;
      onComplete(correct);
    }, 2500);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <div className="text-xl text-white mb-6 font-medium leading-relaxed">
          <RichTextRenderer content={level.question || ""} />
      </div>
      <div className="space-y-3">
        {level.options?.map(option => (
          <button
            key={option.id}
            onClick={() => !showResult && setSelectedAnswer(option.id)}
            disabled={showResult}
            className={`w-full p-4 rounded-xl text-left transition-all duration-300 transform ${
              showResult
                ? option.correct
                  ? 'bg-green-500/30 border-2 border-green-400'
                  : option.id === selectedAnswer
                  ? 'bg-red-500/30 border-2 border-red-400'
                  : 'bg-white/5 border border-white/20 opacity-50'
                : selectedAnswer === option.id
                ? 'bg-white/20 border-2 border-white scale-[1.02]'
                : 'bg-white/5 border border-white/20 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-white font-medium">
                  <RichTextRenderer content={option.text} />
              </div>
              {showResult && option.correct && <Check className="w-5 h-5 text-green-400" />}
              {showResult && !option.correct && option.id === selectedAnswer && <X className="w-5 h-5 text-red-400" />}
            </div>
          </button>
        ))}
      </div>
      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="w-full mt-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          Submit Answer
        </button>
      )}
      {showResult && <ResultFeedback correct={level.options?.find(o => o.id === selectedAnswer)?.correct} />}
    </div>
  );
};

// 2. Flashcard Game
const FlashcardGame: React.FC<{ level: Level, onComplete: (c: boolean) => void }> = ({ level, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards] = useState<Flashcard[]>(level.flashcards || []);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      onComplete(true);
    }
  };

  if (!cards.length) return <div className="text-white">No cards available</div>;

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full text-center text-purple-200 text-sm font-medium">
        Card {currentIndex + 1} of {cards.length}
      </div>
      
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full max-w-md aspect-[3/2] cursor-pointer group perspective-[1000px]"
      >
        <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl border border-white/20 shadow-xl flex flex-col items-center justify-center p-8 text-center">
             <p className="text-sm text-blue-200 uppercase tracking-widest mb-4 font-semibold">Concept / Problem</p>
             <div className="text-xl font-bold text-white overflow-y-auto max-h-48 custom-scrollbar w-full">
                <RichTextRenderer content={currentCard.front} className="inline-block" />
             </div>
             <p className="absolute bottom-6 text-blue-300 text-xs animate-pulse">Tap to reveal</p>
          </div>
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-purple-700 to-indigo-900 rounded-2xl border border-white/20 shadow-xl flex flex-col items-center justify-center p-8 text-center">
             <p className="text-sm text-purple-200 uppercase tracking-widest mb-4 font-semibold">Analysis / Solution</p>
             <div className="text-lg text-white leading-relaxed overflow-y-auto max-h-48 custom-scrollbar w-full">
                 <RichTextRenderer content={currentCard.back} className="inline-block" />
             </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button 
          onClick={handleNext}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
        >
          {currentIndex === cards.length - 1 ? 'Finish' : 'Next Card'}
        </button>
      </div>
    </div>
  );
};

// 3. Matching Game (Enhanced Bidirectional)
const MatchingGame: React.FC<{ level: Level, onComplete: (c: boolean) => void }> = ({ level, onComplete }) => {
  const [pairs] = useState<MatchingPair[]>(level.pairs || []);
  const [leftItems, setLeftItems] = useState<{id: string, text: string}[]>([]);
  const [rightItems, setRightItems] = useState<{id: string, text: string}[]>([]);
  
  const [selection, setSelection] = useState<{ id: string, side: 'left' | 'right' } | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongShake, setWrongShake] = useState(false);

  useEffect(() => {
    const left = pairs.map(p => ({ id: p.id, text: p.left })).sort(() => Math.random() - 0.5);
    const right = pairs.map(p => ({ id: p.id, text: p.right })).sort(() => Math.random() - 0.5);
    setLeftItems(left);
    setRightItems(right);
  }, [pairs]);

  const handleItemClick = (id: string, side: 'left' | 'right') => {
    if (matchedIds.has(id)) return;

    if (!selection) {
      setSelection({ id, side });
      setWrongShake(false);
      return;
    }

    if (selection.id === id && selection.side === side) {
      setSelection(null);
      return;
    }

    if (selection.side === side) {
      setSelection({ id, side });
      return;
    }

    if (selection.id === id) {
      const newMatched = new Set(matchedIds);
      newMatched.add(id);
      setMatchedIds(newMatched);
      setSelection(null);
      
      if (newMatched.size === pairs.length) {
        setTimeout(() => onComplete(true), 1200);
      }
    } else {
      setWrongShake(true);
      setTimeout(() => {
          setSelection(null);
          setWrongShake(false);
      }, 500);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8 relative">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none opacity-20">
         <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
      </div>

      <div className="space-y-6">
        {leftItems.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selection?.side === 'left' && selection.id === item.id;
            const isTarget = selection?.side === 'right' && !isMatched; 
            const shake = wrongShake && !isMatched && selection?.side === 'right' ? 'animate-bounce text-red-400 border-red-400' : '';

            return (
                <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id, 'left')}
                    disabled={isMatched}
                    className={`w-full group relative p-4 rounded-xl text-left transition-all duration-300 border backdrop-blur-sm ${shake}
                        ${isMatched 
                            ? 'bg-green-500/10 border-green-500/40 text-green-300 scale-95 opacity-50' 
                            : isSelected
                            ? 'bg-white/20 border-yellow-400 text-white scale-105 shadow-[0_0_20px_rgba(250,204,21,0.3)] z-10'
                            : isTarget
                            ? 'bg-white/5 border-white/20 text-white hover:border-blue-400 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30'
                        }
                    `}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium"><RichTextRenderer content={item.text} /></span>
                        <div className={`w-3 h-3 rounded-full border-2 transition-all 
                            ${isMatched ? 'bg-green-500 border-green-500' : isSelected ? 'bg-yellow-400 border-yellow-400 animate-pulse' : 'bg-transparent border-white/30 group-hover:border-blue-400'}
                        `}></div>
                    </div>
                    {isSelected && <div className="absolute -right-2 top-1/2 w-4 h-0.5 bg-yellow-400 animate-pulse"></div>}
                </button>
            );
        })}
      </div>

      <div className="space-y-6">
        {rightItems.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selection?.side === 'right' && selection.id === item.id;
            const isTarget = selection?.side === 'left' && !isMatched;
            const shake = wrongShake && !isMatched && selection?.side === 'left' ? 'animate-bounce text-red-400 border-red-400' : '';
            
            return (
                <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id, 'right')}
                    disabled={isMatched}
                    className={`w-full group relative p-4 rounded-xl text-right transition-all duration-300 border backdrop-blur-sm ${shake}
                        ${isMatched 
                            ? 'bg-green-500/10 border-green-500/40 text-green-300 scale-95 opacity-50' 
                            : isSelected
                            ? 'bg-white/20 border-yellow-400 text-white scale-105 shadow-[0_0_20px_rgba(250,204,21,0.3)] z-10'
                            : isTarget
                            ? 'bg-white/5 border-white/20 text-white hover:border-blue-400 hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                            : 'bg-white/5 border-white/10 text-white'
                        }
                    `}
                >
                    <div className="flex items-center justify-between flex-row-reverse">
                         <span className="text-sm font-medium"><RichTextRenderer content={item.text} /></span>
                         <div className={`w-3 h-3 rounded-full border-2 transition-all 
                            ${isMatched ? 'bg-green-500 border-green-500' : isSelected ? 'bg-yellow-400 border-yellow-400 animate-pulse' : 'bg-transparent border-white/30 group-hover:border-blue-400'}
                        `}></div>
                    </div>
                    {isSelected && <div className="absolute -left-2 top-1/2 w-4 h-0.5 bg-yellow-400 animate-pulse"></div>}
                </button>
            );
        })}
      </div>
    </div>
  );
};

// 4. Fill Blank Game
const FillBlankGame: React.FC<{ level: Level, onComplete: (c: boolean) => void }> = ({ level, onComplete }) => {
  const [input, setInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Split sentence by '___' or similar placeholder
  const parts = level.sentence?.split('___') || [level.sentence || ''];

  const checkAnswer = () => {
    const correct = input.trim().toLowerCase() === level.correctAnswer?.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    setTimeout(() => {
        onComplete(correct);
    }, 2500); 
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <div className="text-xl text-white mb-8 font-medium leading-relaxed flex flex-wrap items-center gap-2">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <RichTextRenderer content={part} />
            {i < parts.length - 1 && (
               <input
                 type="text"
                 value={input}
                 disabled={showResult}
                 onChange={(e) => setInput(e.target.value)}
                 className={`bg-black/20 border-b-2 text-center text-white font-bold px-2 py-1 mx-1 outline-none min-w-[100px] transition-colors ${
                    showResult 
                      ? isCorrect ? 'border-green-400 text-green-300' : 'border-red-400 text-red-300'
                      : 'border-white/30 focus:border-yellow-400'
                 }`}
                 placeholder="type here..."
               />
            )}
          </React.Fragment>
        ))}
      </div>

      {!showResult ? (
        <button
          onClick={checkAnswer}
          disabled={!input.trim()}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl disabled:opacity-50 shadow-lg"
        >
          Check Answer
        </button>
      ) : (
         <ResultFeedback correct={isCorrect} answer={level.correctAnswer} />
      )}
    </div>
  );
};

const ResultFeedback: React.FC<{ correct?: boolean, answer?: string }> = ({ correct, answer }) => (
  <div className="text-center mt-6 animate-in zoom-in duration-300">
    <p className={`text-2xl font-bold mb-2 ${correct ? 'text-green-400' : 'text-red-400'}`}>
      {correct ? 'Brilliant!' : 'Not quite right'}
    </p>
    {!correct && answer && <p className="text-white">Correct answer: <span className="font-bold">{answer}</span></p>}
    <p className="text-purple-300 flex items-center justify-center gap-2 mt-2">
       Moving forward... <ArrowRight className="w-4 h-4" />
    </p>
  </div>
);