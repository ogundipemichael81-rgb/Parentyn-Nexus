
import { Session, CBTResult } from '../types';

const DB_KEY = 'parentyn_mock_db_sessions';
const ANALYTICS_KEY = 'parentyn_cbt_analytics';

// Helper to simulate Socket Emit
const notifyUpdate = () => {
    // Dispatch local event for same-tab updates
    window.dispatchEvent(new Event('session-update'));
    // LocalStorage automatically dispatches 'storage' event to OTHER tabs
};

const notifyAnalytics = () => {
    window.dispatchEvent(new Event('analytics-update'));
};

const getDb = (): Session[] => {
    try {
        const stored = localStorage.getItem(DB_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const saveDb = (sessions: Session[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(sessions));
    notifyUpdate();
};

export const sessionManager = {
  /**
   * Generates a new session with a unique 6-digit code.
   */
  createSession: (teacherId: string): Session => {
    const sessions = getDb();
    
    // Generate 6-digit code (avoiding confusing chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (sessions.some(s => s.session_id === code && s.active_status));

    const newSession: Session = {
      session_id: code,
      teacher_id: teacherId,
      created_at: new Date().toISOString(),
      active_status: true,
      students: [],
      sync_state: 'waiting'
    };

    // Mark other sessions by this teacher as inactive
    const updatedSessions = sessions.map(s => {
        if(s.teacher_id === teacherId) return { ...s, active_status: false };
        return s;
    });

    updatedSessions.push(newSession);
    saveDb(updatedSessions);

    return newSession;
  },

  /**
   * Retrieves a session by its ID.
   */
  getSession: (sessionId: string): Session | undefined => {
    return getDb().find(s => s.session_id === sessionId);
  },

  /**
   * Gets the active session for a specific teacher.
   */
  getActiveSessionForTeacher: (teacherId: string): Session | undefined => {
      return getDb().find(s => s.teacher_id === teacherId && s.active_status);
  },

  /**
   * Validates if a session exists and is active.
   */
  isSessionValid: (sessionId: string): boolean => {
    const session = getDb().find(s => s.session_id === sessionId);
    return !!session && session.active_status;
  },

  /**
   * Adds a student to the session.
   */
  joinSession: (sessionId: string, studentName: string): boolean => {
    const sessions = getDb();
    const index = sessions.findIndex(s => s.session_id === sessionId);
    
    if (index === -1 || !sessions[index].active_status) return false;

    if (!sessions[index].students.includes(studentName)) {
      sessions[index].students.push(studentName);
      saveDb(sessions);
    }
    return true;
  },

  /**
   * Updates the Real-Time State (The "Socket Push").
   * This is what the teacher calls to change slides/levels.
   */
  updateSessionState: (
      sessionId: string, 
      updates: Partial<Pick<Session, 'current_module_id' | 'current_level_index' | 'sync_state'>>
  ) => {
      const sessions = getDb();
      const index = sessions.findIndex(s => s.session_id === sessionId);
      
      if (index !== -1) {
          sessions[index] = { ...sessions[index], ...updates };
          saveDb(sessions);
      }
  },

  /**
   * Ends a session.
   */
  endSession: (sessionId: string): void => {
    const sessions = getDb();
    const index = sessions.findIndex(s => s.session_id === sessionId);
    
    if (index !== -1) {
      sessions[index].active_status = false;
      sessions[index].sync_state = 'finished';
      saveDb(sessions);
    }
  },

  // --- ANALYTICS FEATURES ---

  saveCBTResult: (result: CBTResult) => {
      const existing = sessionManager.getCBTResults();
      existing.push(result);
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(existing));
      notifyAnalytics();
  },

  getCBTResults: (): CBTResult[] => {
      try {
          const stored = localStorage.getItem(ANALYTICS_KEY);
          return stored ? JSON.parse(stored) : [];
      } catch (e) { return []; }
  },
  
  getWeakTopics: (): { topic: string, count: number }[] => {
      const results = sessionManager.getCBTResults();
      const topicCounts: Record<string, number> = {};
      
      results.forEach(r => {
          r.wrongTopics.forEach(t => {
              if (!t) return;
              // Clean topic string
              const cleanTopic = t.trim();
              topicCounts[cleanTopic] = (topicCounts[cleanTopic] || 0) + 1;
          });
      });

      return Object.entries(topicCounts)
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
  }
};
