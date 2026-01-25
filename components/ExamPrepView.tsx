import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Settings, GraduationCap, ArrowRight, Loader2, Database, CheckCircle2 } from 'lucide-react';
import { GameModule, Level, ClassLevel } from '../types';
import { generateExamQuestionBankContent } from '../services/aiService';
import { GAME_TEMPLATES } from '../constants';

interface ExamPrepViewProps {
  setModules: (modules: GameModule[]) => void;
  modules: GameModule[];
  setActiveView: (view: any) => void;
}

export const ExamPrepView: React.FC<ExamPrepViewProps> = ({ setModules, modules, setActiveView }) => {
  const [examType, setExamType] = useState('WAEC');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('SSS'); // Default Senior Secondary
  const [year, setYear] = useState('');
  const [topic, setTopic] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, type: string, base64: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files) as File[];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = (ev.target?.result as string).split(',')[1];
                setUploadedFiles(prev => [...prev, {
                    name: file.name,
                    type: file.type,
                    base64: base64
                }]);
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const removeFile = (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
      if (!subject) return;
      setIsGenerating(true);

      try {
          const filesPayload = uploadedFiles.map(f => ({ mimeType: f.type, data: f.base64 }));

          // Use new specialized service to generate questions
          const questions = await generateExamQuestionBankContent(
              questionCount,
              examType,
              subject,
              level,
              year,
              topic,
              filesPayload
          );

          if (questions && questions.length > 0) {
              const newModule: GameModule = {
                  id: `cbt_${Date.now()}`,
                  title: `${examType} CBT: ${subject} ${year || ''}`,
                  template: GAME_TEMPLATES['academic_classroom'],
                  levels: questions, // Populate levels so it is playable immediately
                  metadata: {
                      createdAt: new Date().toISOString(),
                      difficulty: 'hard',
                      estimatedTime: Math.round(questions.length * 2) // ~2 min per question for exam rigour
                  },
                  subject: subject,
                  grade: level,
                  plays: 0,
                  avgScore: 0,
                  type: 'custom',
                  status: 'published',
                  category: 'quantitative', // Assuming broad compatibility
                  questionBank: questions, // Populate question bank
                  lessonNote: `## ${examType} Prep: ${subject}\n\nGenerated CBT Practice Set covering ${topic || 'general curriculum'}.`
              };

              setModules([...modules, newModule]);
              // Optional: Redirect to modules or show success
              setActiveView('modules');
          } else {
              alert("No questions generated. Please check your input or API key.");
          }

      } catch (e) {
          console.error("CBT Generation Error", e);
          alert("Failed to generate CBT set.");
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    <GraduationCap className="w-8 h-8 text-yellow-400" /> Exam Prep Center
                </h2>
                <p className="text-purple-300">Generate Standardized CBT Practice Sets (WAEC/NECO/JAMB)</p>
            </div>
        </div>

        <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
            {/* Left Column: Configuration */}
            <div className="w-full md:w-1/2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                
                {/* 1. Exam Selection */}
                <div className="space-y-3">
                    <label className="text-xs uppercase text-gray-400 font-bold">Examination Board</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['WAEC', 'NECO', 'JAMB'].map(ex => (
                            <button
                                key={ex}
                                onClick={() => setExamType(ex)}
                                className={`py-3 rounded-xl border font-bold transition ${examType === ex ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-black/20 border-white/10 text-white hover:bg-white/10'}`}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Subject & Level */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">Subject</label>
                        <input 
                            type="text" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Mathematics"
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">Class Level</label>
                        <select 
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                        >
                            <option value="Primary">Primary</option>
                            <option value="JSS">JSS (Junior Secondary)</option>
                            <option value="SSS">SSS (Senior Secondary)</option>
                        </select>
                    </div>
                </div>

                {/* 3. Details (Year/Topic) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">Year (Optional)</label>
                        <input 
                            type="text" 
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="e.g. 2023"
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">Question Count</label>
                        <input 
                            type="number" 
                            min={5}
                            max={50}
                            value={questionCount}
                            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase text-gray-400 font-bold">Specific Topic (Optional)</label>
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Calculus, Organic Chemistry"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                    />
                </div>

                {/* 4. Uploads */}
                <div className="space-y-2">
                    <label className="text-xs uppercase text-gray-400 font-bold">Upload Past Questions (PDF/Image)</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 hover:border-yellow-400/50 hover:bg-white/5 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center"
                    >
                        <Upload className="w-8 h-8 text-white/50 mb-2" />
                        <p className="text-sm text-white font-bold">Click to Upload</p>
                        <p className="text-xs text-white/30">Supports scanned papers</p>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="application/pdf,image/*" onChange={handleFileChange} />
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                        <div className="space-y-2 mt-2">
                            {uploadedFiles.map((file, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs text-white truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                    <button onClick={() => removeFile(idx)} className="text-white/30 hover:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Preview & Action */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-black/20 rounded-xl border border-white/5 p-8 text-center relative">
                
                {isGenerating ? (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                        <Loader2 className="w-16 h-16 text-yellow-400 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-white">Synthesizing CBT Set...</h3>
                        <p className="text-purple-300">Analyzing patterns & generating questions</p>
                    </div>
                ) : null}

                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center shadow-2xl mb-6">
                    <Database className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Generate</h3>
                <p className="text-white/60 mb-8 max-w-sm">
                    Create a {questionCount}-question {examType} practice module for {subject} ({level}).
                    The module will be automatically saved to your library.
                </p>

                <button 
                    onClick={handleGenerate}
                    disabled={!subject || isGenerating}
                    className="w-full max-w-xs py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform transition hover:scale-105"
                >
                    <CheckCircle2 className="w-5 h-5" /> Generate CBT Set
                </button>
            </div>
        </div>
    </div>
  );
};
