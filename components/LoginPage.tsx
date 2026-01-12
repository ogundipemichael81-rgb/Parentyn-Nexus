import React, { useState } from 'react';
import { Zap, GraduationCap, Users, ArrowRight, ArrowLeft, AlertCircle, Loader2, School, Mail, Lock, User } from 'lucide-react';
import { UserRole } from '../types';

interface LoginPageProps {
  onLogin: (role: UserRole, data?: any) => Promise<boolean> | boolean;
  isLoading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading = false }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Teacher Auth Mode: 'login' | 'signup'
  const [teacherAuthMode, setTeacherAuthMode] = useState<'login' | 'signup'>('login');

  // Teacher Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  
  // Student Fields
  const [classCode, setClassCode] = useState('');
  const [studentName, setStudentName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
        if (teacherAuthMode === 'login') {
             await onLogin('teacher', { type: 'login', email, password });
        } else {
             await onLogin('teacher', { type: 'signup', name, email, school, password });
        }
    } catch (err) {
        // Error is handled by parent or state, but we can set local error here if needed
        setErrorMsg('Authentication failed. Please check credentials.');
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (classCode.length === 6 && studentName) {
        const success = onLogin('student', { name: studentName, code: classCode });
        if (!success) {
            setErrorMsg('Invalid Code or Session Closed');
        }
    }
  };

  const resetState = () => {
      setSelectedRole(null);
      setErrorMsg('');
      setTeacherAuthMode('login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
      {/* Branding */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
           <Zap className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-lg">Parentyn Nexus</h1>
        <p className="text-purple-300 text-lg font-medium tracking-wide uppercase">AI Learning Alchemist</p>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
         {/* Top loading bar if loading */}
         {isLoading && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"></div>}

         {!selectedRole ? (
             <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-white text-center mb-8">Who is accessing the Nexus?</h2>
                 
                 <button 
                    onClick={() => setSelectedRole('teacher')}
                    className="w-full group relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl transition-all duration-300 flex items-center gap-4"
                 >
                     <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <GraduationCap className="w-6 h-6 text-blue-300" />
                     </div>
                     <div className="text-left">
                         <p className="text-lg font-bold text-white">I am a Teacher</p>
                         <p className="text-sm text-white/50">Manage modules & track progress</p>
                     </div>
                     <ArrowRight className="absolute right-6 w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </button>

                 <button 
                    onClick={() => setSelectedRole('student')}
                    className="w-full group relative p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl transition-all duration-300 flex items-center gap-4"
                 >
                     <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <Users className="w-6 h-6 text-green-300" />
                     </div>
                     <div className="text-left">
                         <p className="text-lg font-bold text-white">I am a Student</p>
                         <p className="text-sm text-white/50">Join a class & start playing</p>
                     </div>
                     <ArrowRight className="absolute right-6 w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </button>
             </div>
         ) : selectedRole === 'teacher' ? (
             <form onSubmit={handleTeacherSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8">
                 <button type="button" onClick={resetState} className="text-white/50 hover:text-white flex items-center gap-2 text-sm mb-4">
                     <ArrowLeft className="w-4 h-4" /> Back to Role Selection
                 </button>
                 
                 <div className="text-center mb-6">
                     <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-3">
                         <GraduationCap className="w-8 h-8 text-blue-300" />
                     </div>
                     <h2 className="text-2xl font-bold text-white">Teacher Portal</h2>
                 </div>

                 {/* Login / Signup Toggle */}
                 <div className="flex bg-black/20 p-1 rounded-xl mb-6">
                     <button
                        type="button"
                        onClick={() => setTeacherAuthMode('login')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${teacherAuthMode === 'login' ? 'bg-white text-purple-900 shadow-md' : 'text-white/50 hover:text-white'}`}
                     >
                         Login
                     </button>
                     <button
                        type="button"
                        onClick={() => setTeacherAuthMode('signup')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${teacherAuthMode === 'signup' ? 'bg-white text-purple-900 shadow-md' : 'text-white/50 hover:text-white'}`}
                     >
                         Create Account
                     </button>
                 </div>

                 {errorMsg && (
                     <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm animate-pulse">
                         <AlertCircle className="w-4 h-4" /> {errorMsg}
                     </div>
                 )}

                 <div className="space-y-3">
                     {teacherAuthMode === 'signup' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                             <div className="relative">
                                 <User className="absolute left-3 top-3.5 w-4 h-4 text-blue-300/50" />
                                 <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 focus:border-blue-400 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 outline-none transition"
                                    placeholder="Full Name"
                                 />
                             </div>
                             <div className="relative">
                                 <School className="absolute left-3 top-3.5 w-4 h-4 text-blue-300/50" />
                                 <input 
                                    type="text" 
                                    required
                                    value={school}
                                    onChange={(e) => setSchool(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 focus:border-blue-400 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 outline-none transition"
                                    placeholder="School Organization"
                                 />
                             </div>
                        </div>
                     )}

                     <div className="relative">
                         <Mail className="absolute left-3 top-3.5 w-4 h-4 text-blue-300/50" />
                         <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 focus:border-blue-400 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 outline-none transition"
                            placeholder="Email Address"
                         />
                     </div>
                     <div className="relative">
                         <Lock className="absolute left-3 top-3.5 w-4 h-4 text-blue-300/50" />
                         <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 focus:border-blue-400 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 outline-none transition"
                            placeholder="Password"
                         />
                     </div>
                 </div>

                 <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-wait text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-4"
                 >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                         <>
                            {teacherAuthMode === 'login' ? 'Enter Dashboard' : 'Create Account'} 
                            <ArrowRight className="w-4 h-4" />
                         </>
                     )}
                 </button>
             </form>
         ) : (
             <form onSubmit={handleStudentLogin} className="space-y-6 animate-in fade-in slide-in-from-right-8">
                 <button type="button" onClick={resetState} className="text-white/50 hover:text-white flex items-center gap-2 text-sm mb-4">
                     <ArrowLeft className="w-4 h-4" /> Back to Role Selection
                 </button>

                 <div className="text-center mb-6">
                     <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-3">
                         <Users className="w-8 h-8 text-green-300" />
                     </div>
                     <h2 className="text-2xl font-bold text-white">Student Access</h2>
                 </div>

                 {errorMsg && (
                     <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm animate-pulse">
                         <AlertCircle className="w-4 h-4" /> {errorMsg}
                     </div>
                 )}

                 <div className="space-y-4">
                     <div>
                         <label className="block text-xs uppercase text-green-200 font-bold mb-2 ml-1">Full Name</label>
                         <input 
                            type="text" 
                            required
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 focus:border-green-400 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition"
                            placeholder="e.g. Chioma Okafor"
                         />
                     </div>
                     <div>
                         <label className="block text-xs uppercase text-green-200 font-bold mb-2 ml-1">6-Digit Class Code</label>
                         <input 
                            type="text" 
                            required
                            maxLength={6}
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                            className="w-full bg-black/20 border border-white/10 focus:border-green-400 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition font-mono text-center tracking-widest text-xl uppercase"
                            placeholder="XYZ123"
                         />
                     </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2 mt-4">
                     Start Learning <ArrowRight className="w-4 h-4" />
                 </button>
             </form>
         )}
      </div>
    </div>
  );
};