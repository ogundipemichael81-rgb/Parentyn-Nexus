import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, MessageCircle, AlertCircle, Check, Terminal, Code, HelpCircle, Loader2 } from 'lucide-react';
import { usePyodide } from '../hooks/usePyodide';
import { getAiCodeHelp } from '../services/aiService';
import { Level } from '../types';
import { RichTextRenderer } from './Shared';

interface CodeLabChallengeProps {
  level: Level;
  onComplete: (correct: boolean) => void;
}

export const CodeLabChallenge: React.FC<CodeLabChallengeProps> = ({ level, onComplete }) => {
  const { pyodide, isLoading, runCode, output, plotImage, error, initialize, resetEnvironment } = usePyodide();
  
  const [code, setCode] = useState(level.starterCode || '');
  const [isRunning, setIsRunning] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHints, setShowHints] = useState(false);

  // Initialize Pyodide on mount
  useEffect(() => {
    if (!pyodide && !isLoading) {
        initialize();
    }
  }, [pyodide, isLoading, initialize]);

  // Validation Logic
  useEffect(() => {
      if (!isRunning && output.length > 0) {
          const joinedOutput = output.join('\n');
          // Simple validation: check if target output string exists in the stdout
          if (level.targetOutput && joinedOutput.includes(level.targetOutput)) {
              setShowConfetti(true);
              setTimeout(() => {
                  onComplete(true);
              }, 3000);
          }
      }
  }, [output, isRunning, level.targetOutput, onComplete]);

  const handleRun = async () => {
      setIsRunning(true);
      setAiHint(null);
      await runCode(code);
      setIsRunning(false);
  };

  const handleAskAi = async () => {
      if (!level.challenge) return;
      setIsAskingAi(true);
      const hint = await getAiCodeHelp(level.challenge, code, error);
      setAiHint(hint);
      setIsAskingAi(false);
  };

  const handleReset = () => {
      setCode(level.starterCode || '');
      resetEnvironment();
      setAiHint(null);
  };

  if (!pyodide && isLoading) {
      return (
          <div className="h-96 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-white/10 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-yellow-400 mb-4" />
              <p className="font-mono text-sm">Initializing Python Environment...</p>
          </div>
      );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px] relative animate-in fade-in zoom-in duration-500">
        
        {/* Confetti Overlay Effect (Simple CSS Animation) */}
        {showConfetti && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="text-center animate-bounce">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-green-400">Success!</h2>
                    <p className="text-white">Module Completed</p>
                </div>
            </div>
        )}

        {/* Left Panel: Instructions & Tools (40%) */}
        <div className="w-full md:w-[40%] bg-white/5 border-r border-white/10 p-6 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Lab Challenge</h3>
                </div>
                
                <div className="prose prose-invert prose-sm text-white/90 mb-6">
                    <RichTextRenderer content={level.challenge || "Solve the problem using Python."} />
                </div>

                <div className="space-y-3">
                     <button 
                        onClick={() => setShowHints(!showHints)}
                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition text-sm text-white"
                     >
                         <span className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-yellow-400" /> View Hints</span>
                         <span className="text-xs text-white/50">{showHints ? 'Hide' : 'Show'}</span>
                     </button>
                     
                     {showHints && level.hints && (
                         <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-100 animate-in slide-in-from-top-2">
                             <ul className="list-disc pl-4 space-y-1">
                                 {level.hints.map((h, i) => <li key={i}>{h}</li>)}
                             </ul>
                         </div>
                     )}

                     {aiHint && (
                         <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-sm text-purple-200 animate-in slide-in-from-left-2">
                             <strong className="block mb-1 text-purple-300">AI Tutor:</strong>
                             {aiHint}
                         </div>
                     )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                <button 
                    onClick={handleAskAi}
                    disabled={isAskingAi}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg flex items-center justify-center gap-2 transition text-sm font-bold"
                >
                    {isAskingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Ask AI Tutor
                </button>
                <button 
                    onClick={handleReset}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg flex items-center justify-center gap-2 transition text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Reset Code
                </button>
            </div>
        </div>

        {/* Right Panel: Editor & Output (60%) */}
        <div className="w-full md:w-[60%] flex flex-col bg-slate-950">
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/10">
                <span className="text-xs font-mono text-white/50 flex items-center gap-2">
                    <Code className="w-3 h-3" /> main.py
                </span>
                <span className="text-[10px] uppercase text-green-400 font-bold tracking-wider">
                    Pyodide Active
                </span>
            </div>

            {/* Code Editor Area (Textarea for MVP) */}
            <div className="flex-1 relative">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full bg-slate-950 text-white font-mono text-sm p-4 resize-none outline-none leading-relaxed"
                    spellCheck={false}
                    placeholder="# Write your Python code here..."
                />
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-end">
                <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-lg shadow-green-900/20"
                >
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    Run Code
                </button>
            </div>

            {/* Output Console */}
            <div className="h-48 bg-black border-t border-white/10 overflow-y-auto p-4 font-mono text-xs">
                 {error ? (
                     <div className="text-red-400 flex items-start gap-2">
                         <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                         <pre className="whitespace-pre-wrap font-mono">{error}</pre>
                     </div>
                 ) : (
                     <div className="space-y-2">
                         {output.map((line, i) => (
                             <div key={i} className="text-white/80 border-l-2 border-green-500/50 pl-2">{line}</div>
                         ))}
                         {plotImage && (
                             <div className="mt-2 border border-white/20 rounded-lg overflow-hidden bg-white w-fit">
                                 <img src={plotImage} alt="Matplotlib Plot" className="max-w-full h-auto" />
                             </div>
                         )}
                         {output.length === 0 && !plotImage && (
                             <span className="text-white/30 italic">Output will appear here...</span>
                         )}
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};