import React, { useState } from 'react';
import { Play, RotateCw, CheckCircle2, ArrowLeft, XCircle, Check, X, BookOpen, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { GameModule, StudentProgress, Level } from '../types';
import { GameplayView } from './GameplayView';
import { RichTextRenderer } from './Shared';

interface StudentDashboardProps {
  modules: GameModule[];
  currentModule: GameModule | null;
  setCurrentModule: (m: GameModule | null) => void;
  progress: StudentProgress;
  setProgress: (p: StudentProgress) => void;
  onGameComplete?: (moduleId: string, score: number, totalPoints: number) => void;
}

interface LevelResult {
    title: string;
    correct: boolean;
    points: number;
    type: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ modules, currentModule, setCurrentModule, progress, setProgress, onGameComplete }) => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [viewState, setViewState] = useState<'study' | 'play' | 'result'>('study');
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<LevelResult[]>([]);

  const startGame = (module: GameModule) => {
    setCurrentModule(module);
    setCurrentLevelIndex(0);
    setScore(0);
    setResults([]);
    // If module has notes, start in study mode, otherwise go straight to play
    setViewState(module.lessonNote ? 'study' : 'play');
  };

  const handleLevelComplete = (correct: boolean) => {
    if (currentModule) {
      const currentLevel = currentModule.levels[currentLevelIndex];
      const levelPoints = correct ? (currentLevel?.points || 0) : 0;
      
      const newScore = score + levelPoints;

      // Optimistically update score state
      if (correct) {
        setScore(newScore);
      }

      // Record result
      const newResults = [...results, {
          title: currentLevel.title,
          correct: correct,
          points: levelPoints,
          type: currentLevel.type
      }];
      setResults(newResults);

      if (currentLevelIndex < currentModule.levels.length - 1) {
        // Small delay for transition effect could be added here
        setCurrentLevelIndex(prev => prev + 1);
      } else {
        // Game Finished
        finishGame(newScore, newResults);
      }
    }
  };

  const finishGame = (finalScore: number, finalResults: LevelResult[]) => {
    setViewState('result');
    
    // Trigger callback for real-time updates in teacher view
    if (currentModule && onGameComplete) {
        const totalPossible = currentModule.levels.reduce((sum, l) => sum + l.points, 0);
        onGameComplete(currentModule.id, finalScore, totalPossible);
    }
  };

  const quitGame = () => {
    setViewState('study');
    setCurrentModule(null);
    setCurrentLevelIndex(0);
  };

  // 1. Study Phase (Lesson Notes)
  if (viewState === 'study' && currentModule) {
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right duration-500 pb-12">
              <div className="flex items-center justify-between">
                  <button onClick={quitGame} className="text-purple-300 hover:text-white flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="text-right">
                      <h2 className="text-2xl font-bold text-white">{currentModule.title}</h2>
                      <p className="text-sm text-purple-300">Read carefully before playing!</p>
                  </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                      <div className="p-3 bg-yellow-500/20 rounded-lg">
                        <BookOpen className="w-6 h-6 text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Class Note</h3>
                  </div>
                  
                  <div className="prose prose-invert max-w-none text-white/90 leading-relaxed text-lg">
                      <RichTextRenderer content={currentModule.lessonNote || "No notes available for this module."} />
                  </div>

                  {/* Primary School Illustrations */}
                  {currentModule.classLevel === 'primary' && currentModule.illustrations && currentModule.illustrations.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-white/10">
                          <h4 className="text-yellow-400 font-bold mb-4 uppercase text-xs tracking-wider">Pictographic Illustrations</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currentModule.illustrations.map((img, idx) => (
                                  <div key={idx} className="bg-black/20 rounded-xl p-4 border border-white/5 flex gap-4 items-center">
                                      <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <ImageIcon className="w-8 h-8 text-purple-300" />
                                      </div>
                                      <div>
                                          <p className="text-white font-medium text-sm italic">"{img.description}"</p>
                                          <p className="text-purple-300 text-xs mt-1 font-bold">{img.caption}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              <button 
                onClick={() => setViewState('play')}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 text-lg transition transform hover:scale-[1.01]"
              >
                  I'm Ready to Play! <ChevronRight className="w-5 h-5" />
              </button>
          </div>
      );
  }

  // 2. Game Finished View
  if (viewState === 'result' && currentModule) {
    const totalPossiblePoints = currentModule.levels.reduce((sum, lvl) => sum + lvl.points, 0);
    const percentage = totalPossiblePoints > 0 ? Math.round((score / totalPossiblePoints) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in duration-500 py-8">
        <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl mb-4 ${
                percentage >= 50 ? 'bg-green-500 shadow-green-500/50' : 'bg-orange-500 shadow-orange-500/50'
            }`}>
              {percentage >= 50 ? <CheckCircle2 className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Module Completed!</h2>
            <p className="text-purple-300 text-lg">
                {percentage >= 80 ? "Outstanding Performance!" : percentage >= 50 ? "Good job!" : "Keep practicing!"}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                <p className="text-xs text-purple-300 uppercase tracking-widest font-semibold mb-2">Total Score</p>
                <p className="text-4xl font-bold text-yellow-400 drop-shadow-md">{score} <span className="text-lg text-white/50">/ {totalPossiblePoints}</span></p>
             </div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                <p className="text-xs text-purple-300 uppercase tracking-widest font-semibold mb-2">Accuracy</p>
                <p className={`text-4xl font-bold drop-shadow-md ${percentage >= 50 ? 'text-green-400' : 'text-orange-400'}`}>{percentage}%</p>
             </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
             <h3 className="text-white font-bold mb-4">Performance Assessment</h3>
             <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {results.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${result.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {result.correct ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                            </div>
                            <div>
                                <p className="text-white font-medium">{result.title}</p>
                                <p className="text-xs text-purple-300 capitalize">{result.type}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                            {result.correct ? `+${result.points}` : '0'} pts
                        </span>
                    </div>
                ))}
             </div>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={quitGame}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <button 
            onClick={() => startGame(currentModule)}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg"
          >
            <RotateCw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // 3. Active Gameplay View
  if (viewState === 'play' && currentModule) {
    const activeLevel = currentModule.levels[currentLevelIndex];
    // Safety check if level exists
    if (!activeLevel) {
       return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-white/60 text-sm max-w-4xl mx-auto">
          <button onClick={quitGame} className="hover:text-white transition">Exit Game</button>
          <span>Level {currentLevelIndex + 1} of {currentModule.levels.length}</span>
          <span>Score: {score}</span>
        </div>
        <GameplayView 
          key={activeLevel.id} // Key ensures component resets on level change
          level={activeLevel}
          onComplete={handleLevelComplete}
        />
      </div>
    );
  }

  // 4. Module Selection (Dashboard)
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Your Learning Arena</h2>
          <p className="text-purple-300">Choose a module and start playing</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20 shadow-lg">
          <p className="text-xs text-purple-300 uppercase tracking-widest font-semibold">Total Score</p>
          <p className="text-3xl font-bold text-yellow-400 drop-shadow-md">{score}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map(module => (
          <div key={module.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition group hover:-translate-y-1 duration-300">
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{module.title}</h3>
                <span className="text-xs px-2 py-1 bg-white/10 rounded text-purple-200">{module.subject}</span>
              </div>
              <p className="text-purple-300 text-sm line-clamp-2">{module.template.theme}</p>
              
              <div className="mt-3 flex gap-2 text-xs text-purple-400">
                 <span>{module.metadata.estimatedTime} mins</span>
                 <span>•</span>
                 <span className="capitalize">{module.metadata.difficulty}</span>
                 <span>•</span>
                 <span>{module.levels.length} Levels</span>
              </div>
            </div>
            
            <button
              onClick={() => startGame(module)}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg group-hover:shadow-green-500/20"
            >
              <Play className="w-5 h-5 fill-white" />
              Start Playing
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};