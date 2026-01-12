import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { TeacherProfile } from '../types';

export const useAuth = () => {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true); // Initial app load check

  // Check persistence on mount
  useEffect(() => {
    const stored = authService.getCurrentUser();
    if (stored) {
      setTeacher(stored);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    // Return promise so UI can await it
    const user = await authService.login(email, pass);
    setTeacher(user);
    return user;
  };

  const signup = async (name: string, email: string, school: string, pass: string) => {
    const user = await authService.signup(name, email, school, pass);
    setTeacher(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setTeacher(null);
  };

  return { 
      teacher, 
      loading, 
      login, 
      signup, 
      logout,
      isAuthenticated: !!teacher 
  };
};