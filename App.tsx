import React, { useState, useEffect } from 'react';
import { Zap, LogOut, Loader2 } from 'lucide-react';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { LoginPage } from './components/LoginPage';
import { SAMPLE_MODULES } from './constants';
import { GameModule, UserRole, ViewState, StudentProgress, Student, Session } from './types';
import { sessionManager } from './services/sessionManager';
import { useAuth } from './hooks/useAuth';

// Mock initial students
const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: 'Chioma Okafor', plays: 12, avgScore: 85, streak: 5 },
  { id: 2, name: 'Tunde Bakare', plays: 8, avgScore: 72, streak: 3 },
  { id: 3, name: 'Amina Yusuf', plays: 15, avgScore: 91, streak: 7 }
];

export default function App() {
  const { teacher, loading: authLoading, login: teacherLogin, signup: teacherSignup, logout: teacherLogout, isAuthenticated: isTeacherAuth } = useAuth();
  
  // Overall App Auth State (Teacher OR Student)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [modules, setModules] = useState<GameModule[]>(SAMPLE_MODULES);
  const [currentModule, setCurrentModule] = useState<GameModule | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({});
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  
  // Session State
  const [activeSession, setActiveSession] = useState<Session | undefined>(undefined);
  // Specifically for Student View: which session did they join?
  const [studentActiveSessionId, setStudentActiveSessionId] = useState<string | undefined>(undefined);

  // Sync Teacher Auth from Hook to App State
  useEffect(() => {
      if (!authLoading && isTeacherAuth && teacher) {
          setIsAuthenticated(true);
          setUserRole('teacher');
          // Check for existing session
          const existingSession = sessionManager.getActiveSessionForTeacher(teacher.id);
          if (existingSession) {
              setActiveSession(existingSession);
          }
      } else if (!authLoading && !isTeacherAuth && userRole === 'teacher') {
          // If teacher logged out
          setIsAuthenticated(false);
      }
  }, [isTeacherAuth, authLoading, teacher]);

  const handleCreateSession = () => {
      if (teacher) {
        const newSession = sessionManager.createSession(teacher.id);
        setActiveSession({...newSession});
      }
  };

  const handleEndSession = (sessionId: string) => {
      sessionManager.endSession(sessionId);
      setActiveSession(undefined);
  };

  const handleLogin = async (role: UserRole, data?: any): Promise<boolean> => {
      if (role === 'teacher') {
          const { type, email, password, name, school } = data;
          try {
              if (type === 'signup') {
                  await teacherSignup(name, email, school, password);
              } else {
                  await teacherLogin(email, password);
              }
              // useAuth hook will trigger the useEffect to set IsAuthenticated
              return true;
          } catch (e) {
              console.error(e);
              throw e; // Propagate to LoginPage for error display
          }
      }
      
      if (role === 'student') {
          const { name, code } = data || {};
          if (!name || !code) return false;

          // 1. Validate Session via Manager
          if (sessionManager.isSessionValid(code)) {
              setUserRole('student');
              setIsAuthenticated(true);
              setStudentActiveSessionId(code); // Track which session student is in
              
              // 2. Join Session via Manager
              sessionManager.joinSession(code, name);
              
              // 3. Update local student registry (Mock logic)
              const existingStudent = students.find(s => s.name.toLowerCase() === name.toLowerCase());
              if (!existingStudent) {
                  setStudents(prev => [...prev, { id: Date.now(), name, plays: 0, avgScore: 0, streak: 0 }]);
              }
              
              // 4. Update Teacher View (Mock Realtime Update simulation)
              const currentSession = sessionManager.getSession(code);
              if (currentSession) {
                  setActiveSession({...currentSession});
              }

              return true;
          } else {
              return false; // Invalid or Inactive Code
          }
      }
      return false;
  };

  const handleLogout = () => {
      if (userRole === 'teacher') {
          teacherLogout();
      }
      setIsAuthenticated(false);
      setActiveView('dashboard');
      setCurrentModule(null);
      setStudentActiveSessionId(undefined);
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

    // 2. Update Student Stats (simplified for now)
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

  if (authLoading) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-yellow-400 animate-spin"></div>
                      <Zap className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-white animate-pulse" />
                  </div>
                  <p className="text-white font-bold tracking-widest text-sm uppercase">Initializing Nexus...</p>
              </div>
          </div>
      );
  }

  if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} isLoading={authLoading} />;
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
                    Logged in as <span className="text-white capitalize font-bold">{userRole === 'teacher' && teacher ? teacher.name : userRole}</span>
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
            teacherName={teacher?.name}
          />
        ) : (
          <StudentDashboard 
            modules={modules}
            currentModule={currentModule}
            setCurrentModule={setCurrentModule}
            progress={studentProgress}
            setProgress={setStudentProgress}
            onGameComplete={handleGameComplete}
            activeSessionId={studentActiveSessionId}
          />
        )}
      </div>
    </div>
  );
}