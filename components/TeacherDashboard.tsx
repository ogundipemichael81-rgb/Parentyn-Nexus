import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Zap, Trophy, Upload, BarChart3, Users, Check, Star, Flame, Play, Layers, Puzzle, PenTool, HelpCircle, AlertCircle, Loader2, FileText, Image as ImageIcon, X, Settings, Layout, MoreHorizontal, GraduationCap, Clock, Save, Eye, ArrowRight, Trash2, Edit2, FileDigit, TextQuote, AlignLeft, AlignJustify, FilePlus, PlusCircle, RotateCcw, ChevronDown, Database, Sparkles, CheckSquare, Square, Maximize2, Plus, GripVertical, Camera } from 'lucide-react';
import { GameModule, ViewState, ActivityType, Student, ClassLevel, ModuleCategory, NoteLength, Level } from '../types';
import { GAME_TEMPLATES } from '../constants';
import { generateGameContent, verifyContext, generateSpecificLevel, extendLessonNote } from '../services/aiService';
import { NavButton, StatCard, Step, RichTextRenderer } from './Shared';
import { GameplayView } from './GameplayView';

interface TeacherDashboardProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  modules: GameModule[];
  setModules: (modules: GameModule[]) => void;
  currentModule: GameModule | null;
  setCurrentModule: (m: GameModule | null) => void;
  students: Student[];
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  activeView, setActiveView, modules, setModules, currentModule, setCurrentModule, students
}) => {
  const [generatedModule, setGeneratedModule] = useState<GameModule | null>(null);
  const [editingModule, setEditingModule] = useState<GameModule | null>(null);

  const handleEditModule = (module: GameModule) => {
    setEditingModule(module);
    setActiveView('studio');
  };

  const handleClearEdit = () => {
    setEditingModule(null);
    setGeneratedModule(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-500">
      <div className="md:col-span-3">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 sticky top-24">
          <div className="mb-6 px-2">
            <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-1 opacity-70">Main Menu</h3>
          </div>
          <nav className="space-y-2">
            <NavButton 
              icon={BarChart3} 
              label="Overview" 
              active={activeView === 'dashboard'}
              onClick={() => { setActiveView('dashboard'); handleClearEdit(); }}
            />
            <NavButton 
              icon={Zap} 
              label="Curriculum Studio" 
              active={activeView === 'studio'}
              onClick={() => { setActiveView('studio'); handleClearEdit(); }}
            />
            <NavButton 
              icon={BookOpen} 
              label="Module Library" 
              active={activeView === 'modules'}
              onClick={() => { setActiveView('modules'); handleClearEdit(); }}
            />
            <NavButton 
              icon={Users} 
              label="Student Registry" 
              active={activeView === 'students'}
              onClick={() => { setActiveView('students'); handleClearEdit(); }}
            />
          </nav>
          
          <div className="mt-8 mb-2 px-2">
             <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-1 opacity-70">System</h3>
          </div>
          <nav className="space-y-2">
            <NavButton 
              icon={Settings} 
              label="Configuration" 
              active={false}
              onClick={() => {}}
            />
          </nav>
        </div>
      </div>

      <div className="md:col-span-9">
        {activeView === 'dashboard' && <DashboardView modules={modules} />}
        {activeView === 'studio' && (
          <StudioView 
            setGeneratedModule={setGeneratedModule}
            generatedModule={generatedModule}
            setModules={setModules}
            modules={modules}
            editingModule={editingModule}
            onClearEdit={handleClearEdit}
          />
        )}
        {activeView === 'modules' && (
            <ModulesView 
                modules={modules} 
                setCurrentModule={setCurrentModule} 
                onEdit={handleEditModule}
            />
        )}
        {activeView === 'students' && <StudentsView students={students} />}
      </div>
    </div>
  );
};

// --- Sub Components for Teacher Views ---

const DashboardView: React.FC<{ modules: GameModule[] }> = ({ modules }) => {
  const publishedModules = modules.filter(m => m.status === 'published' || !m.status);
  const totalPlays = publishedModules.reduce((sum, m) => sum + (m.plays || 0), 0);
  const avgScore = publishedModules.length > 0 
    ? Math.round(publishedModules.reduce((sum, m) => sum + (m.avgScore || 0), 0) / publishedModules.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Academy Overview</h2>
          <p className="text-purple-300">Real-time performance metrics</p>
        </div>
        <div className="flex gap-2">
            <button className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg border border-white/10">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Published Modules" value={publishedModules.length} color="blue" />
        <StatCard icon={Play} label="Total Sessions" value={totalPlays} color="green" />
        <StatCard icon={Trophy} label="Global Avg" value={`${avgScore}%`} color="yellow" />
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Recent Activity Log</h3>
            <MoreHorizontal className="text-white/50 w-5 h-5 cursor-pointer" />
        </div>
        <div className="space-y-1">
            <div className="grid grid-cols-12 text-xs text-purple-300 uppercase font-semibold pb-2 border-b border-white/10 px-4">
                <div className="col-span-6">Module Name</div>
                <div className="col-span-2 text-right">Plays</div>
                <div className="col-span-2 text-right">Avg Score</div>
                <div className="col-span-2 text-right">Status</div>
            </div>
          {modules.slice(0, 5).map(module => (
            <div key={module.id} className="grid grid-cols-12 items-center py-3 px-4 hover:bg-white/5 transition border-b border-white/5 last:border-0">
              <div className="col-span-6">
                <p className="text-white font-medium text-sm">{module.title}</p>
                <p className="text-xs text-purple-400">{module.subject} • {module.grade}</p>
              </div>
              <div className="col-span-2 text-right text-white font-mono text-sm">{module.plays}</div>
              <div className="col-span-2 text-right text-green-400 font-mono text-sm">{module.avgScore}%</div>
              <div className="col-span-2 text-right">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${module.status === 'draft' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                <span className="text-xs text-white/70 capitalize">{module.status || 'Published'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StudioViewProps {
  setGeneratedModule: (m: GameModule | null) => void;
  generatedModule: GameModule | null;
  setModules: (m: GameModule[]) => void;
  modules: GameModule[];
  editingModule: GameModule | null;
  onClearEdit: () => void;
}

const StudioView: React.FC<StudioViewProps> = ({ setGeneratedModule, generatedModule, setModules, modules, editingModule, onClearEdit }) => {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState<ClassLevel>('secondary');
  const [category, setCategory] = useState<ModuleCategory>('qualitative');
  const [noteLength, setNoteLength] = useState<NoteLength>('standard');
  const [selectedTemplate, setSelectedTemplate] = useState('neutral');
  const [customContext, setCustomContext] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'generating' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<{name: string, type: string, base64: string} | null>(null);
  
  // Editor View UI States
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [selectedLevelIds, setSelectedLevelIds] = useState<Set<string | number>>(new Set());
  const [extensionPrompt, setExtensionPrompt] = useState('');
  const [showExtensionInput, setShowExtensionInput] = useState(false);
  const [previewLevel, setPreviewLevel] = useState<Level | null>(null);
  const [isPreviewEditing, setIsPreviewEditing] = useState(false);

  // Edit State for Review
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState<number>(0);
  const [editDiff, setEditDiff] = useState('medium');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Edit Mode
  useEffect(() => {
      if (editingModule) {
          setGeneratedModule(editingModule);
          setEditTitle(editingModule.title);
          setEditTime(editingModule.metadata.estimatedTime);
          setEditDiff(editingModule.metadata.difficulty);
          setSubject(editingModule.subject || '');
          setClassLevel(editingModule.classLevel || 'secondary');
          setCategory(editingModule.category || 'qualitative');
          setStep(5);
          setSelectedLevelIds(new Set(editingModule.levels.map(l => l.id)));
      }
  }, [editingModule]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1];
        setUploadedFile({
            name: file.name,
            type: file.type,
            base64: base64Data
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if ((!content.trim() && !uploadedFile) || !subject.trim()) return;
    
    setErrorMsg('');
    setStep(4); // Moving to processing step
    
    try {
      if (selectedTemplate === 'custom' && customContext.trim()) {
         setStatus('verifying');
         const verification = await verifyContext(customContext);
         if (!verification.approved) {
             setStatus('error');
             setErrorMsg(verification.feedback || "Context unsuitable for children.");
             setStep(3); // Go back to context step
             return;
         }
      }

      setStatus('generating');
      const template = selectedTemplate === 'custom' ? GAME_TEMPLATES['academic_classroom'] : GAME_TEMPLATES[selectedTemplate]; 
      
      const result = await generateGameContent(
          content, 
          uploadedFile ? { mimeType: uploadedFile.type, data: uploadedFile.base64 } : null,
          template, 
          selectedTemplate === 'custom' ? customContext.trim() : undefined,
          classLevel,
          subject,
          category,
          noteLength
      );
      
      // New Module
      setGeneratedModule(result);
      setEditTitle(result.title);
      setEditTime(result.metadata.estimatedTime);
      setEditDiff(result.metadata.difficulty);
      
      // Auto-select all new levels
      setSelectedLevelIds(new Set(result.levels.map(l => l.id)));

      setStatus('idle');
      setStep(5); // Review step

    } catch (e) {
      console.error("Failed to generate", e);
      setStatus('error');
      setErrorMsg("System error during content synthesis. Please retry.");
      setStep(3);
    }
  };

  // --- Specific AI Actions for Editor ---

  const handleAddAILevel = async (type: ActivityType | 'boss_level' | 'question_bank') => {
      if (!generatedModule) return;
      setShowLevelMenu(false);
      setIsProcessingAction(true);

      try {
          const newLevels = await generateSpecificLevel(type, generatedModule.lessonNote || "", subject || generatedModule.subject || "General", classLevel || generatedModule.classLevel || 'secondary');
          
          setGeneratedModule(prev => prev ? ({
              ...prev,
              levels: [...prev.levels, ...newLevels],
              metadata: {
                  ...prev.metadata,
                  estimatedTime: prev.metadata.estimatedTime + 5 // Roughly add 5 mins per new activity
              }
          }) : null);
          setEditTime(prev => prev + 5);
          
          // Auto-select newly added levels
          setSelectedLevelIds(prev => {
              const next = new Set(prev);
              newLevels.forEach(l => next.add(l.id));
              return next;
          });

      } catch (e) {
          console.error("Failed to add level", e);
          alert("Could not generate level. Please check API Key or try again.");
      } finally {
          setIsProcessingAction(false);
      }
  };

  const handleExtendNote = async () => {
      if (!generatedModule) return;
      setIsProcessingAction(true);
      try {
          const extendedNote = await extendLessonNote(
              generatedModule.lessonNote || "", 
              subject || generatedModule.subject || "General", 
              classLevel || generatedModule.classLevel || 'secondary',
              extensionPrompt
          );
          setGeneratedModule(prev => prev ? ({ ...prev, lessonNote: extendedNote }) : null);
          setExtensionPrompt('');
          setShowExtensionInput(false);
      } catch (e) {
          console.error("Failed to extend note", e);
      } finally {
          setIsProcessingAction(false);
      }
  };

  const handleUpdateLevel = (updatedLevel: Level) => {
      if (generatedModule) {
          const newLevels = generatedModule.levels.map(l => l.id === updatedLevel.id ? updatedLevel : l);
          setGeneratedModule({
              ...generatedModule,
              levels: newLevels
          });
          setPreviewLevel(updatedLevel);
      }
  };

  const handleSave = (status: 'draft' | 'published') => {
    if (generatedModule) {
      // Filter levels based on selection
      const activeLevels = generatedModule.levels.filter(l => selectedLevelIds.has(l.id));
      
      const finalModule = {
          ...generatedModule,
          title: editTitle,
          status: status,
          levels: activeLevels,
          metadata: {
              ...generatedModule.metadata,
              estimatedTime: editTime,
              difficulty: editDiff
          }
      };

      // Check if updating existing
      const existingIndex = modules.findIndex(m => m.id === finalModule.id);
      if (existingIndex >= 0) {
          const updatedModules = [...modules];
          updatedModules[existingIndex] = finalModule;
          setModules(updatedModules);
      } else {
          setModules([...modules, finalModule]);
      }
      
      handleExit();
    }
  };

  const handleExit = () => {
    setStep(1);
    setContent('');
    setSubject('');
    setUploadedFile(null);
    setCustomContext('');
    setSelectedTemplate('neutral');
    setGeneratedModule(null);
    setSelectedLevelIds(new Set());
    onClearEdit();
  };

  const removeLevel = (index: number) => {
      if (generatedModule) {
          const levelToRemove = generatedModule.levels[index];
          const newLevels = generatedModule.levels.filter((_, i) => i !== index);
          setGeneratedModule({
              ...generatedModule,
              levels: newLevels
          });
          // Also remove from selection
          setSelectedLevelIds(prev => {
              const next = new Set(prev);
              next.delete(levelToRemove.id);
              return next;
          });
      }
  };
  
  const toggleLevelSelection = (id: string | number) => {
      setSelectedLevelIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
              next.delete(id);
          } else {
              next.add(id);
          }
          return next;
      });
  };

  const getLevelIcon = (type: ActivityType) => {
    switch(type) {
      case 'flashcards': return <Layers className="w-4 h-4 text-blue-300" />;
      case 'matching': return <Puzzle className="w-4 h-4 text-green-300" />;
      case 'fill_blank': return <PenTool className="w-4 h-4 text-pink-300" />;
      default: return <HelpCircle className="w-4 h-4 text-yellow-300" />;
    }
  };

  const getLevelDescription = (type: ActivityType) => {
      switch(type) {
        case 'flashcards': return "Active Recall: Students review key definitions or concepts.";
        case 'matching': return "Association: Students link related concepts to build neural connections.";
        case 'fill_blank': return "Mastery: Students apply knowledge to complete sentences or equations.";
        case 'quiz': return "Application: Students solve problems or answer scenarios.";
        default: return "";
      }
  };

  // Render Studio Steps
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">
              {editingModule ? 'Editor Mode' : 'Curriculum Studio'}
          </h2>
          <p className="text-purple-300 flex items-center gap-2 text-sm">
             <Settings className="w-3 h-3" /> Content Management System v2.4
          </p>
        </div>
        <div className="flex bg-white/10 rounded-lg p-1">
             {[1,2,3].map(s => (
                 <div key={s} className={`px-4 py-1 text-xs font-bold rounded flex items-center gap-2 ${step === s ? 'bg-white text-purple-900' : 'text-white/50'}`}>
                    <span>0{s}</span>
                    <span className="hidden md:inline">{s === 1 ? 'Source' : s === 2 ? 'Config' : 'Context'}</span>
                 </div>
             ))}
        </div>
      </div>

      {/* Main Studio Container */}
      <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative">
         
         {/* Step 1: Source Material */}
         {step === 1 && (
            <div className="w-full p-8 animate-in fade-in slide-in-from-right-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-yellow-400" /> 
                      Source Material
                  </h3>
                  {(content || uploadedFile) && (
                      <button 
                        onClick={() => { setContent(''); setUploadedFile(null); }}
                        className="text-xs text-red-300 hover:text-red-200 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                      >
                         <Trash2 className="w-3 h-3" /> Clear
                      </button>
                  )}
                </div>
                
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-purple-200 uppercase tracking-wider flex items-center gap-2">
                                <Camera className="w-4 h-4 text-purple-400" />
                                Upload & Capture
                            </label>
                            
                            {!uploadedFile ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 hover:border-yellow-400/50 hover:bg-white/5 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    
                                    <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-lg border border-white/5 relative">
                                        <Upload className="w-8 h-8 text-white/70 absolute" />
                                        <Camera className="w-4 h-4 text-yellow-400 absolute bottom-4 right-4 bg-black/50 rounded-full p-0.5" />
                                    </div>
                                    
                                    <p className="text-white font-bold text-lg">Drop File or Snap Photo</p>
                                    <p className="text-xs text-white/40 mt-1 max-w-[200px] text-center leading-relaxed">
                                        Supports PDF, Images, Handwritten Notes, and Whiteboard Snaps
                                    </p>
                                    
                                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
                                </div>
                            ) : (
                                <div className="h-64 bg-green-900/20 border border-green-500/30 rounded-xl flex flex-col items-center justify-center relative">
                                    <button onClick={() => setUploadedFile(null)} className="absolute top-4 right-4 p-2 hover:bg-black/20 rounded-full text-white"><X className="w-4 h-4"/></button>
                                    <FileText className="w-12 h-12 text-green-400 mb-4" />
                                    <p className="text-white font-bold">{uploadedFile.name}</p>
                                    <p className="text-green-400 text-xs mt-1">Ready for processing</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4 flex flex-col">
                             <label className="text-sm font-medium text-purple-200 uppercase tracking-wider">Manual Input</label>
                             <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Type or paste lesson content here..."
                                className="flex-1 min-h-[250px] bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-yellow-400/50 resize-none font-mono text-sm leading-relaxed"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between shrink-0">
                    <div></div>
                    <button 
                        onClick={() => setStep(2)}
                        disabled={!content.trim() && !uploadedFile}
                        className="px-8 py-3 bg-white text-purple-900 font-bold rounded-lg hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                    >
                        Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
         )}

         {/* Step 2: Configuration */}
         {step === 2 && (
             <div className="w-full p-8 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-yellow-400" /> Module Configuration
                 </h3>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                     <div>
                         <label className="block text-sm font-medium text-purple-200 uppercase tracking-wider mb-3">Target Subject</label>
                         <input 
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-yellow-400/50 outline-none transition"
                            placeholder="e.g. Mathematics, Biology"
                         />
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-purple-200 uppercase tracking-wider mb-3">Academic Level</label>
                         <div className="grid grid-cols-2 gap-4">
                             <button
                                onClick={() => setClassLevel('primary')}
                                className={`px-4 py-3 rounded-lg border flex items-center justify-center gap-2 transition ${classLevel === 'primary' ? 'bg-yellow-500 border-yellow-500 text-black font-bold' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                             >
                                <Star className="w-4 h-4" /> Primary
                             </button>
                             <button
                                onClick={() => setClassLevel('secondary')}
                                className={`px-4 py-3 rounded-lg border flex items-center justify-center gap-2 transition ${classLevel === 'secondary' ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                             >
                                <GraduationCap className="w-4 h-4" /> Secondary
                             </button>
                         </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-purple-200 uppercase tracking-wider mb-3">Content Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setCategory('qualitative')}
                                className={`px-4 py-3 rounded-lg border flex items-center justify-center gap-2 transition ${category === 'qualitative' ? 'bg-purple-600 border-purple-600 text-white font-bold' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                            >
                                <TextQuote className="w-4 h-4" /> Qualitative
                            </button>
                            <button
                                onClick={() => setCategory('quantitative')}
                                className={`px-4 py-3 rounded-lg border flex items-center justify-center gap-2 transition ${category === 'quantitative' ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                            >
                                <FileDigit className="w-4 h-4" /> Quantitative
                            </button>
                        </div>
                        <p className="text-xs text-white/50 mt-2">
                            {category === 'quantitative' ? 'Enables LaTeX support for complex math & formulas.' : 'Optimized for text-based subjects and storytelling.'}
                        </p>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-purple-200 uppercase tracking-wider mb-3">Lesson Depth</label>
                        <div className="grid grid-cols-3 gap-2">
                             <button
                                onClick={() => setNoteLength('concise')}
                                className={`px-2 py-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition ${noteLength === 'concise' ? 'bg-white text-purple-900 border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                             >
                                <AlignLeft className="w-4 h-4" /> 
                                <span className="text-xs font-bold">Brief</span>
                             </button>
                             <button
                                onClick={() => setNoteLength('standard')}
                                className={`px-2 py-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition ${noteLength === 'standard' ? 'bg-white text-purple-900 border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                             >
                                <AlignJustify className="w-4 h-4" />
                                <span className="text-xs font-bold">Standard</span>
                             </button>
                             <button
                                onClick={() => setNoteLength('extensive')}
                                className={`px-2 py-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition ${noteLength === 'extensive' ? 'bg-white text-purple-900 border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                             >
                                <FilePlus className="w-4 h-4" />
                                <span className="text-xs font-bold">Deep Dive</span>
                             </button>
                        </div>
                        <p className="text-xs text-white/50 mt-2">
                            {noteLength === 'concise' ? 'Short summaries (~1 page).' : noteLength === 'standard' ? 'Standard class notes (~2-3 pages).' : 'Comprehensive multi-page guide with examples.'}
                        </p>
                     </div>
                 </div>

                 <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep(1)} className="text-white/50 hover:text-white transition">Back</button>
                    <button 
                        onClick={() => setStep(3)}
                        disabled={!subject}
                        className="px-8 py-3 bg-white text-purple-900 font-bold rounded-lg hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Next Step <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
             </div>
         )}

         {/* Step 3: Context Selection */}
         {step === 3 && (
             <div className="w-full p-8 animate-in fade-in slide-in-from-right-4 flex flex-col h-full">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-yellow-400" /> Context & Theme
                 </h3>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                     {/* Neutral Option - Explicit */}
                     <button
                        onClick={() => setSelectedTemplate('neutral')}
                        className={`relative group p-4 rounded-xl text-left border-2 transition-all ${
                            selectedTemplate === 'neutral' 
                            ? 'bg-slate-700/50 border-white shadow-xl' 
                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                        }`}
                     >
                        <div className="mb-3 w-10 h-10 rounded bg-slate-800 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate-300" />
                        </div>
                        <h4 className="text-white font-bold">Standard Academic</h4>
                        <p className="text-sm text-slate-300 mt-1">Neutral, distraction-free environment. No gamified narrative.</p>
                        {selectedTemplate === 'neutral' && <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>}
                     </button>

                     {/* Other Templates */}
                     {Object.entries(GAME_TEMPLATES).filter(([k]) => k !== 'neutral').map(([key, template]) => (
                        <button
                            key={key}
                            onClick={() => { setSelectedTemplate(key); setCustomContext(''); }}
                            className={`relative group p-4 rounded-xl text-left border-2 transition-all ${
                                selectedTemplate === key
                                ? `bg-gradient-to-br ${template.bgColor} border-white shadow-xl`
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                            }`}
                        >
                             <div className="mb-3 w-10 h-10 rounded bg-black/20 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-white font-bold">{template.name}</h4>
                            <p className="text-sm text-white/80 mt-1 line-clamp-2">{template.theme}</p>
                            {selectedTemplate === key && <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full shadow-lg"></div>}
                        </button>
                     ))}

                     {/* Custom */}
                     <button
                        onClick={() => setSelectedTemplate('custom')}
                        className={`relative group p-4 rounded-xl text-left border-2 transition-all ${
                            selectedTemplate === 'custom' 
                            ? 'bg-gradient-to-br from-pink-600 to-rose-600 border-white shadow-xl' 
                            : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                        }`}
                     >
                        <div className="mb-3 w-10 h-10 rounded bg-black/20 flex items-center justify-center">
                            <PenTool className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-white font-bold">Custom World</h4>
                        <p className="text-sm text-white/80 mt-1">Define your own universe.</p>
                        {selectedTemplate === 'custom' && <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full shadow-lg"></div>}
                     </button>
                 </div>

                 {selectedTemplate === 'custom' && (
                     <div className="mt-4">
                         <input 
                            type="text" 
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value)}
                            placeholder="Describe your custom world..."
                            className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-pink-500 outline-none"
                         />
                     </div>
                 )}

                 <div className="mt-8 flex justify-between border-t border-white/10 pt-6">
                    <button onClick={() => setStep(2)} className="text-white/50 hover:text-white transition">Back</button>
                    <button 
                        onClick={handleGenerate}
                        className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-lg transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4 fill-white" /> Generate Module
                    </button>
                </div>
             </div>
         )}

         {/* Step 4: Loading State */}
         {step === 4 && (
             <div className="w-full flex flex-col items-center justify-center p-8 animate-in fade-in">
                 {status === 'error' ? (
                     <div className="text-center">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Synthesis Failed</h3>
                        <p className="text-red-300 mb-6">{errorMsg}</p>
                        <button onClick={() => setStep(3)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">Return to Context</button>
                     </div>
                 ) : (
                     <>
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-yellow-400 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Parentyn Nexus Engine</h3>
                        <p className="text-purple-300 text-sm tracking-widest uppercase">
                             {status === 'verifying' ? 'Verifying Safety Protocols...' : 'Synthesizing Curriculum Content...'}
                        </p>
                     </>
                 )}
             </div>
         )}

         {/* Step 5: Review & Publish (Editor Mode) */}
         {step === 5 && generatedModule && (
             <div className="w-full p-8 animate-in fade-in slide-in-from-bottom-8 flex flex-col h-full relative">
                 {isProcessingAction && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl flex-col">
                         <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mb-4" />
                         <p className="text-white font-bold animate-pulse">Generating Assets...</p>
                     </div>
                 )}

                 {/* Preview Modal */}
                 {previewLevel && (
                    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-white/20 relative shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 rounded-t-2xl">
                                <div>
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        {isPreviewEditing ? <Edit2 className="w-5 h-5 text-blue-400" /> : <Eye className="w-5 h-5 text-yellow-400" />} 
                                        {isPreviewEditing ? 'Edit Level Parameters' : 'Preview Mode'}
                                    </h3>
                                    <p className="text-xs text-purple-300">
                                        {isPreviewEditing ? 'Configure game logic and content' : 'Experience the game as a student'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsPreviewEditing(!isPreviewEditing)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${isPreviewEditing ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        {isPreviewEditing ? <Eye className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                                        {isPreviewEditing ? 'Switch to Preview' : 'Edit Level'}
                                    </button>
                                    <button 
                                        onClick={() => { setPreviewLevel(null); setIsPreviewEditing(false); }}
                                        className="p-2 hover:bg-white/10 rounded-full text-white transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-br from-slate-900 to-slate-800">
                                {isPreviewEditing ? (
                                    <LevelEditor level={previewLevel} onSave={(l) => { handleUpdateLevel(l); setIsPreviewEditing(false); }} />
                                ) : (
                                    <GameplayView 
                                        level={previewLevel} 
                                        onComplete={() => {}} 
                                    />
                                )}
                            </div>
                            {!isPreviewEditing && (
                                <div className="p-4 border-t border-white/10 bg-black/20 rounded-b-2xl text-center">
                                    <p className="text-xs text-white/40 italic">Preview Mode - Scores are not recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                 )}
                 
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Module Editor</h3>
                        <p className="text-sm text-purple-300 flex items-center gap-2">
                            Review and configure before publishing
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExit} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm">Close</button>
                        <button onClick={() => handleSave('draft')} className="px-4 py-2 bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 font-bold rounded-lg border border-yellow-500/50 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Save Draft
                        </button>
                        <button onClick={() => handleSave('published')} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-600/20 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Publish
                        </button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                     {/* Metadata Editor */}
                     <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <div>
                                 <label className="text-xs text-white/50 uppercase tracking-wide block mb-1">Module Title</label>
                                 <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 px-3 py-2">
                                     <Edit2 className="w-4 h-4 text-white/40" />
                                     <input 
                                        type="text" 
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="bg-transparent text-white font-bold outline-none w-full" 
                                     />
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-xs text-white/50 uppercase tracking-wide block mb-1">Duration (min)</label>
                                     <input 
                                        type="number" 
                                        value={editTime}
                                        onChange={(e) => setEditTime(parseInt(e.target.value) || 0)}
                                        className="bg-white/5 rounded-lg border border-white/10 px-3 py-2 text-white w-full outline-none" 
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs text-white/50 uppercase tracking-wide block mb-1">Difficulty</label>
                                     <select 
                                        value={editDiff} 
                                        onChange={(e) => setEditDiff(e.target.value)}
                                        className="bg-white/5 rounded-lg border border-white/10 px-3 py-2 text-white w-full outline-none"
                                     >
                                         <option value="easy">Easy</option>
                                         <option value="medium">Medium</option>
                                         <option value="hard">Hard</option>
                                     </select>
                                 </div>
                             </div>
                         </div>
                         <div className="flex justify-between items-center">
                             <div className="flex gap-2">
                                 <span className="px-2 py-1 bg-white/10 rounded text-xs text-white border border-white/10 uppercase tracking-wide">{generatedModule.subject}</span>
                                 <span className="px-2 py-1 bg-white/10 rounded text-xs text-white border border-white/10 uppercase tracking-wide">{generatedModule.grade}</span>
                                 <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30 uppercase tracking-wide">{generatedModule.classLevel}</span>
                             </div>
                         </div>
                     </div>

                     {/* Lesson Note Preview & Tools */}
                     <div className="bg-white/5 rounded-xl p-6 border border-white/10 relative group">
                         <div className="flex flex-col gap-4 mb-4 border-b border-white/10 pb-4">
                             <div className="flex justify-between items-center">
                                 <h4 className="text-purple-300 text-xs font-bold uppercase tracking-wider">Generated Lesson Material</h4>
                                 <div className="flex gap-2">
                                     <button 
                                         onClick={() => setShowExtensionInput(!showExtensionInput)}
                                         className={`px-3 py-1 text-xs rounded border flex items-center gap-1 transition ${showExtensionInput ? 'bg-purple-500 text-white border-purple-500' : 'bg-purple-500/20 text-purple-200 border-purple-500/30 hover:bg-purple-500/30'}`}
                                     >
                                         <FilePlus className="w-3 h-3" /> Extend Note
                                     </button>
                                     <button 
                                         onClick={() => handleAddAILevel('question_bank')}
                                         className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs rounded border border-blue-500/30 flex items-center gap-1 transition"
                                     >
                                         <Database className="w-3 h-3" /> Generate Question Bank
                                     </button>
                                 </div>
                             </div>
                             
                             {showExtensionInput && (
                                 <div className="animate-in fade-in slide-in-from-top-2 flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-white/10">
                                     <input 
                                        type="text" 
                                        value={extensionPrompt}
                                        onChange={(e) => setExtensionPrompt(e.target.value)}
                                        placeholder="Enter instructions (e.g., 'Add a paragraph about relativity', 'Simplify the introduction')..."
                                        className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder-white/30"
                                        onKeyDown={(e) => e.key === 'Enter' && handleExtendNote()}
                                     />
                                     <button 
                                        onClick={handleExtendNote}
                                        className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition shadow-lg"
                                        title="Generate Extension"
                                     >
                                        <ArrowRight className="w-4 h-4" />
                                     </button>
                                 </div>
                             )}
                         </div>
                         <div className="prose prose-invert prose-sm max-w-none text-white/80 max-h-96 overflow-y-auto custom-scrollbar">
                             <RichTextRenderer content={generatedModule.lessonNote || ''} />
                         </div>
                     </div>

                     {/* Levels Grid with Dropdown */}
                     <div>
                         <div className="flex items-center justify-between mb-4">
                             <h4 className="text-white font-bold text-lg">Game Levels</h4>
                             
                             <div className="relative">
                                 <button 
                                     onClick={() => setShowLevelMenu(!showLevelMenu)}
                                     className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg"
                                 >
                                    <PlusCircle className="w-4 h-4" /> Add AI Level <ChevronDown className="w-4 h-4" />
                                 </button>
                                 
                                 {showLevelMenu && (
                                     <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                         <div className="p-2 space-y-1">
                                             <button onClick={() => handleAddAILevel('flashcards')} className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm flex items-center gap-2">
                                                 <Layers className="w-4 h-4 text-blue-400" /> Flashcards (Memory)
                                             </button>
                                             <button onClick={() => handleAddAILevel('matching')} className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm flex items-center gap-2">
                                                 <Puzzle className="w-4 h-4 text-green-400" /> Matching (Logic)
                                             </button>
                                             <button onClick={() => handleAddAILevel('quiz')} className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm flex items-center gap-2">
                                                 <HelpCircle className="w-4 h-4 text-yellow-400" /> Quiz (Assessment)
                                             </button>
                                             <button onClick={() => handleAddAILevel('fill_blank')} className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm flex items-center gap-2">
                                                 <PenTool className="w-4 h-4 text-pink-400" /> Fill in Blanks (Mastery)
                                             </button>
                                             <div className="h-px bg-white/10 my-1"></div>
                                             <button onClick={() => handleAddAILevel('boss_level')} className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg text-sm flex items-center gap-2">
                                                 <Sparkles className="w-4 h-4 text-orange-400" /> Boss Level (Challenge)
                                             </button>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {generatedModule.levels.map((level, i) => {
                                 const isSelected = selectedLevelIds.has(level.id);
                                 return (
                                     <div 
                                        key={i} 
                                        onClick={() => toggleLevelSelection(level.id)}
                                        className={`rounded-xl p-4 border transition group relative overflow-hidden cursor-pointer ${
                                            isSelected 
                                                ? 'bg-white/10 border-green-500/50 hover:bg-white/20' 
                                                : 'bg-white/5 border-white/5 opacity-60 grayscale hover:grayscale-0 hover:bg-white/10'
                                        }`}
                                     >
                                         <div className="absolute top-2 left-2 flex gap-2 z-10">
                                            {isSelected 
                                                ? <CheckSquare className="w-5 h-5 text-green-400" /> 
                                                : <Square className="w-5 h-5 text-white/30" />
                                            }
                                         </div>

                                         <div className="absolute top-2 right-2 flex gap-2 z-10">
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); setPreviewLevel(level); }}
                                                className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition"
                                                title="Preview Level"
                                             >
                                                 <Eye className="w-3 h-3" />
                                             </button>
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); removeLevel(i); }}
                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                                                title="Remove Level"
                                             >
                                                 <Trash2 className="w-3 h-3" />
                                             </button>
                                         </div>
                                         <div className="absolute top-0 right-10 p-2 opacity-10 group-hover:opacity-20 transition pointer-events-none">
                                             {getLevelIcon(level.type)}
                                         </div>
                                         <div className="flex items-center justify-between mb-2 mr-16 pl-8">
                                             <div className="flex items-center gap-2">
                                                 <div className="p-2 bg-black/20 rounded-lg text-purple-300">
                                                     {getLevelIcon(level.type)}
                                                 </div>
                                                 <div>
                                                    <span className="font-bold text-white text-sm block">{level.title}</span>
                                                    <span className="text-[10px] text-white/40 uppercase tracking-wider">{level.type.replace('_', ' ')}</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="flex items-center gap-2 mb-2 pl-8">
                                             <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">{level.points} PTS</span>
                                         </div>
                                         <p className="text-xs text-white/60 line-clamp-1 mb-2 italic pl-8">"{level.challenge || 'Standard Activity'}"</p>
                                         
                                         {/* Teacher Description Preview */}
                                         <div className="mt-2 pt-2 border-t border-white/5 pl-8">
                                             <p className="text-[10px] text-blue-300">
                                                 <span className="font-bold">Goal:</span> {getLevelDescription(level.type)}
                                             </p>
                                         </div>
                                     </div>
                                 );
                             })}
                             
                             {generatedModule.levels.length === 0 && (
                                 <div className="col-span-full py-8 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/40">
                                     <Layers className="w-8 h-8 mb-2 opacity-50" />
                                     <p className="text-sm">No game levels yet.</p>
                                     <p className="text-xs">Use "Add AI Level" to generate activities.</p>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>
             </div>
         )}
         
      </div>
    </div>
  );
};

const ModulesView: React.FC<{
  modules: GameModule[];
  setCurrentModule: (m: GameModule | null) => void; 
  onEdit: (m: GameModule) => void;
}> = ({ modules, setCurrentModule, onEdit }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Module Library</h2>
          <p className="text-purple-300">Manage your educational content</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => (
          <div key={module.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col">
            <div className="mb-4 flex-1">
               <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${module.status === 'published' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {module.status || 'Published'}
                  </span>
                  <div className="flex gap-1">
                      <button onClick={() => onEdit(module)} className="p-2 hover:bg-white/10 rounded-lg text-white transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                  </div>
               </div>
               <h3 className="text-xl font-bold text-white mb-1">{module.title}</h3>
               <p className="text-sm text-purple-300 mb-3">{module.subject} • {module.grade}</p>
               <p className="text-white/60 text-sm line-clamp-3 mb-4">{module.lessonNote ? module.lessonNote.substring(0, 100) + '...' : 'No lesson note.'}</p>
               
               <div className="flex gap-4 text-xs text-white/50 border-t border-white/10 pt-4">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {module.metadata.estimatedTime} min</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {module.levels.length} Levels</span>
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {module.plays || 0} Plays</span>
               </div>
            </div>
            
            <button 
                onClick={() => onEdit(module)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition border border-white/10 text-sm"
            >
                Edit Module
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const StudentsView: React.FC<{ students: Student[] }> = ({ students }) => {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold text-white mb-1">Student Registry</h2>
          <p className="text-purple-300">Track student progress and performance</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20">
            <table className="w-full text-left">
                <thead className="bg-black/20 text-purple-200 uppercase text-xs font-bold tracking-wider">
                    <tr>
                        <th className="p-4">Student Name</th>
                        <th className="p-4 text-right">Modules Played</th>
                        <th className="p-4 text-right">Avg Score</th>
                        <th className="p-4 text-right">Streak</th>
                        <th className="p-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white text-sm">
                    {students.map(student => (
                        <tr key={student.id} className="hover:bg-white/5 transition">
                            <td className="p-4 font-bold">{student.name}</td>
                            <td className="p-4 text-right">{student.plays}</td>
                            <td className="p-4 text-right">
                                <span className={student.avgScore >= 80 ? 'text-green-400' : student.avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                                    {student.avgScore}%
                                </span>
                            </td>
                            <td className="p-4 text-right flex justify-end items-center gap-1">
                                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> {student.streak}
                            </td>
                            <td className="p-4 text-center">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

const LevelEditor: React.FC<{ level: Level; onSave: (l: Level) => void }> = ({ level, onSave }) => {
    const [editedLevel, setEditedLevel] = useState<Level>(level);

    // Simple editor based on level type
    return (
        <div className="space-y-6 text-white">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs uppercase text-purple-300 font-bold mb-1">Title</label>
                    <input 
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" 
                        value={editedLevel.title}
                        onChange={(e) => setEditedLevel({...editedLevel, title: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-purple-300 font-bold mb-1">Points</label>
                    <input 
                        type="number"
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" 
                        value={editedLevel.points}
                        onChange={(e) => setEditedLevel({...editedLevel, points: parseInt(e.target.value) || 0})}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs uppercase text-purple-300 font-bold mb-1">Challenge / Instruction</label>
                    <input 
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white" 
                        value={editedLevel.challenge || ''}
                        onChange={(e) => setEditedLevel({...editedLevel, challenge: e.target.value})}
                    />
                </div>
            </div>

            {/* Content Specific Editors */}
            {editedLevel.type === 'quiz' && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                        <label className="block text-xs uppercase text-purple-300 font-bold mb-1">Question</label>
                        <textarea 
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-24" 
                            value={editedLevel.question || ''}
                            onChange={(e) => setEditedLevel({...editedLevel, question: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-purple-300 font-bold mb-2">Options</label>
                        {editedLevel.options?.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                <input 
                                    type="radio" 
                                    name="correct-opt"
                                    checked={opt.correct}
                                    onChange={() => {
                                        const newOpts = editedLevel.options?.map((o, i) => ({...o, correct: i === idx})) || [];
                                        setEditedLevel({...editedLevel, options: newOpts});
                                    }}
                                />
                                <input 
                                    className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white"
                                    value={opt.text}
                                    onChange={(e) => {
                                        const newOpts = [...(editedLevel.options || [])];
                                        newOpts[idx] = {...newOpts[idx], text: e.target.value};
                                        setEditedLevel({...editedLevel, options: newOpts});
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {editedLevel.type === 'flashcards' && (
                 <div className="space-y-4 border-t border-white/10 pt-4">
                     {editedLevel.flashcards?.map((card, idx) => (
                         <div key={idx} className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg">
                             <div>
                                 <label className="text-xs text-purple-300">Front</label>
                                 <input 
                                     className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                     value={card.front}
                                     onChange={(e) => {
                                         const newCards = [...(editedLevel.flashcards || [])];
                                         newCards[idx] = {...newCards[idx], front: e.target.value};
                                         setEditedLevel({...editedLevel, flashcards: newCards});
                                     }}
                                 />
                             </div>
                             <div>
                                 <label className="text-xs text-purple-300">Back</label>
                                 <input 
                                     className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                     value={card.back}
                                     onChange={(e) => {
                                         const newCards = [...(editedLevel.flashcards || [])];
                                         newCards[idx] = {...newCards[idx], back: e.target.value};
                                         setEditedLevel({...editedLevel, flashcards: newCards});
                                     }}
                                 />
                             </div>
                         </div>
                     ))}
                 </div>
            )}

            <button 
                onClick={() => onSave(editedLevel)}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
            >
                Save Changes
            </button>
        </div>
    );
};