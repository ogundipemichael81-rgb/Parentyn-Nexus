import { TeacherProfile } from '../types';

const STORAGE_KEY = 'parentyn_teacher_user';

export const authService = {
  /**
   * Simulates an API Login call.
   */
  login: async (email: string, password: string): Promise<TeacherProfile> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock validation
        if (!email.includes('@')) {
            reject(new Error('Invalid email address'));
            return;
        }

        // Mock User Return
        const mockUser: TeacherProfile = {
          id: 't_' + Date.now(),
          name: 'Demo Teacher', // Default name for login if not creating new
          email,
          school: 'Parentyn Academy',
          role: 'teacher'
        };
        
        // Persist
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
        resolve(mockUser);
      }, 1500); // 1.5s simulated network delay
    });
  },

  /**
   * Simulates an API Sign-Up call.
   */
  signup: async (name: string, email: string, school: string, password: string): Promise<TeacherProfile> => {
     return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!name || !email || !password) {
            reject(new Error('Missing fields'));
            return;
        }

        const newUser: TeacherProfile = {
          id: 't_' + Date.now(),
          name,
          email,
          school,
          role: 'teacher'
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        resolve(newUser);
      }, 1500);
    });
  },

  /**
   * Clear session.
   */
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Check for existing session.
   */
  getCurrentUser: (): TeacherProfile | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
  }
};