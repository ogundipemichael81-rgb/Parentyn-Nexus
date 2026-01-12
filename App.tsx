import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SAMPLE_MODULES } from './constants';
import { GameModule, UserRole, ViewState, StudentProgress, Student } from './types';

// Mock initial students
const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: 'Chioma Okafor', plays: 12, avgScore: 85, streak: 5 },
  { id: 2, name: 'Tunde Bakare', plays: 8, avgScore: 72, streak: 3 },
  { id: 3, name: 'Amina Yusuf', plays: 15, avgScore: 91, streak: 7 }
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [modules, setModules] = useState<GameModule[]>(SAMPLE_MODULES);
  const [currentModule, setCurrentModule] = useState<GameModule | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({});
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);

  // Simulate real-time updates when a student finishes a game
  const handleGameComplete = (moduleId: string, score: number, totalPoints: number) => {
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    // 1. Update Module Stats
    setModules(prev => prev.map(m => {
        if (m.id === moduleId) {
            const newPlays = (m.plays || 0) + 1;
            // Weighted average calculation
            const currentTotalScore = (m.avgScore || 0) * (m.plays || 0);
            const newAvg = Math.round((currentTotalScore + percentage) / newPlays);
            return { ...m, plays: newPlays, avgScore: newAvg };
        }
        return m;
    }));

    // 2. Update Student Stats (Simulating the active user is 'Chioma Okafor' - ID 1)
    setStudents(prev => prev.map(s => {
        if (s.id === 1) {
             const newPlays = s.plays + 1;
             const currentTotal = s.avgScore * s.plays;
             const newAvg = Math.round((currentTotal + percentage) / newPlays);
             return { ...s, plays: newPlays, avgScore: newAvg, streak: s.streak + 1 };
        }
        return s;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Parentyn Nexus</h1>
                <p className="text-xs text-purple-300 font-medium tracking-wide uppercase">AI Learning Alchemist</p>
              </div>
            </div>
            
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              <button
                onClick={() => setUserRole('teacher')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  userRole === 'teacher' 
                    ? 'bg-white text-purple-900 shadow-md' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Teacher View
              </button>
              <button
                onClick={() => setUserRole('student')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  userRole === 'student' 
                    ? 'bg-white text-purple-900 shadow-md' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Student View
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {userRole === 'teacher' ? (
          <TeacherDashboard 
            activeView={activeView}
            setActiveView={setActiveView}
            modules={modules}
            setModules={setModules}
            currentModule={currentModule}
            setCurrentModule={setCurrentModule}
            students={students}
          />
        ) : (
          <StudentDashboard 
            modules={modules}
            currentModule={currentModule}
            setCurrentModule={setCurrentModule}
            progress={studentProgress}
            setProgress={setStudentProgress}
            onGameComplete={handleGameComplete}
          />
        )}
      </div>
    </div>
  );
}