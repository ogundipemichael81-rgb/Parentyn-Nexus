import { Session } from '../types';

// Mock Database Storage
let MOCK_DB_SESSIONS: Session[] = [];

export const sessionManager = {
  /**
   * Generates a new session with a unique 6-digit code.
   * This simulates an INSERT operation into a database.
   */
  createSession: (teacherId: string): Session => {
    // Generate 6-digit code (avoiding confusing chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (MOCK_DB_SESSIONS.some(s => s.session_id === code && s.active_status)); // Ensure uniqueness among active

    const newSession: Session = {
      session_id: code,
      teacher_id: teacherId,
      created_at: new Date().toISOString(),
      active_status: true,
      students: []
    };

    // Add to "DB"
    MOCK_DB_SESSIONS.push(newSession);
    
    // In a real DB, we might want to ensure only one active session per teacher
    // For this mock, we mark others by this teacher as inactive
    MOCK_DB_SESSIONS.forEach(s => {
        if(s.teacher_id === teacherId && s.session_id !== code) {
            s.active_status = false;
        }
    });

    return newSession;
  },

  /**
   * Retrieves a session by its ID.
   * Simulates a SELECT * FROM sessions WHERE session_id = ...
   */
  getSession: (sessionId: string): Session | undefined => {
    return MOCK_DB_SESSIONS.find(s => s.session_id === sessionId);
  },

  /**
   * Gets the active session for a specific teacher.
   */
  getActiveSessionForTeacher: (teacherId: string): Session | undefined => {
      return MOCK_DB_SESSIONS.find(s => s.teacher_id === teacherId && s.active_status);
  },

  /**
   * Validates if a session exists and is active.
   */
  isSessionValid: (sessionId: string): boolean => {
    const session = MOCK_DB_SESSIONS.find(s => s.session_id === sessionId);
    return !!session && session.active_status;
  },

  /**
   * Adds a student to the session.
   * Simulates an UPDATE or sub-collection insert.
   */
  joinSession: (sessionId: string, studentName: string): boolean => {
    const session = MOCK_DB_SESSIONS.find(s => s.session_id === sessionId);
    if (!session || !session.active_status) return false;

    if (!session.students.includes(studentName)) {
      session.students.push(studentName);
    }
    return true;
  },

  /**
   * Ends a session (soft delete/status update).
   */
  endSession: (sessionId: string): void => {
    const session = MOCK_DB_SESSIONS.find(s => s.session_id === sessionId);
    if (session) {
      session.active_status = false;
    }
  }
};