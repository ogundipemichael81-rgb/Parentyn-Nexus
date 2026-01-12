import React, { useState } from 'react';
import { Zap, LogOut } from 'lucide-react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { LoginPage } from './components/LoginPage';
import { SAMPLE_MODULES } from './constants';
import { GameModule, UserRole, ViewState, StudentProgress, Student, Session } from './types';
import { sessionManager } from './services/sessionManager';

// Mock initial students
const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: 'Chioma Okafor', plays: 12, avgScore: 85, streak: 5 },
  { id: 2, name: 'Tunde Bakare', plays: 8, avgScore: 72, streak: 3 },
  { id: 3, name: 'Amina Yusuf', plays: 15, avgScore: 91, streak: 7 }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [modules, setModules] = useState<GameModule[]>(SAMPLE_MODULES);
  const [currentModule, setCurrentModule] = useState<GameModule | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({});
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  
  // Session State (synced with SessionManager)
  // In a real app with Firebase, this would be a realtime listener
  const [activeSession, setActiveSession] = useState<Session | undefined>(undefined);

  const handleCreateSession = () => {
      const newSession = sessionManager.createSession('teacher-1');
      setActiveSession({...newSession}); // Spread to force react re-render
  };

  const handleEndSession = (sessionId: string) => {
      sessionManager.endSession(sessionId);
      setActiveSession(undefined);
  };

  const handleLogin = (role: UserRole, data?: { name?: string, code?: string }): boolean => {
      if (role === 'teacher') {
          setUserRole('teacher');
          setIsAuthenticated(true);
          // Check if this teacher already has an active session from the manager
          const existingSession = sessionManager.getActiveSessionForTeacher('teacher-1');
          if (existingSession) {
              setActiveSession(existingSession);
          }
          return true;
      }
      
      if (role === 'student') {
          const { name, code } = data || {};
          if (!name || !code) return false;

          // 1. Validate Session via Manager
          if (sessionManager.isSessionValid(code)) {
              setUserRole('student');
              setIsAuthenticated(true);
              
              // 2. Join Session via Manager
              sessionManager.joinSession(code, name);
              
              // 3. Update local student registry (Mock logic)
              const existingStudent = students.find(s => s.name.toLowerCase() === name.toLowerCase());
              if (!existingStudent) {
                  setStudents(prev => [...prev, { id: Date.now(), name, plays: 0, avgScore: 0, streak: 0 }]);
              }
              
              // 4. Update Teacher View (Mock Realtime Update)
              // Since App.tsx holds the state for both views in this demo, 
              // we refresh the activeSession state to show the new student on the teacher's dashboard
              const currentSession = sessionManager.getSession(code);
              if (currentSession) {
                  setActiveSession({...currentSession});
              }

              console.log(`Student ${name} joined session ${code}`);
              return true;
          } else {
              return false; // Invalid or Inactive Code
          }
      }
      return false;
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUserRole('teacher'); 
      setActiveView('dashboard');
      setCurrentModule(null);
  };

  const handleGameComplete = (moduleId: string, score: number, totalPoints: number) => {
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    // 1. Update Module Stats
    setModules(prev => prev.map(m => {
        if (m.id === moduleId) {
            const newPlays = (m.plays || 0) + 1;
            const currentTotalScore = (m.avgScore || 0) * (m.plays || 0);
            const newAvg = Math.round((currentTotalScore + percentage) / newPlays);
            return { ...m, plays: newPlays, avgScore: newAvg };
        }
        return m;
    }));

    // 2. Update Student Stats
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

  if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
  }

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
            
            <div className="flex items-center gap-4">
                <span className="text-white/50 text-sm font-medium hidden md:inline-block">
                    Logged in as <span className="text-white capitalize">{userRole}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
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
            activeSession={activeSession}
            onCreateSession={handleCreateSession}
            onEndSession={handleEndSession}
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