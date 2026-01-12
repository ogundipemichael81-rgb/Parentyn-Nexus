
export type ViewState = 'dashboard' | 'studio' | 'modules' | 'students';
export type UserRole = 'teacher' | 'student';
export type ActivityType = 'quiz' | 'flashcards' | 'matching' | 'fill_blank';
export type ClassLevel = 'primary' | 'secondary';
export type ModuleCategory = 'qualitative' | 'quantitative';
export type ModuleStatus = 'draft' | 'published';
export type NoteLength = 'concise' | 'standard' | 'extensive';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  school: string;
  role: 'teacher';
}

export interface GameTemplate {
  id: string;
  name: string;
  theme: string;
  bgColor: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Illustration {
    description: string;
    caption: string;
}

export interface Level {
  id: number | string;
  title: string;
  type: ActivityType;
  points: number;
  
  // Specific content fields
  // Quiz & General
  challenge?: string; // Scenario/Context
  concept?: string;   // Educational explanation
  
  // Quiz
  question?: string;
  options?: QuestionOption[];

  // Flashcards (Deck)
  flashcards?: Flashcard[];

  // Matching
  pairs?: MatchingPair[];

  // Fill in Blank
  sentence?: string;
  correctAnswer?: string;
}

export interface ModuleMetadata {
  createdAt: string;
  difficulty: string;
  estimatedTime: number;
}

export interface GameModule {
  id: string;
  title: string;
  template: GameTemplate;
  levels: Level[];
  metadata: ModuleMetadata;
  subject?: string;
  grade?: string;
  plays?: number;
  avgScore?: number;
  type?: 'library' | 'custom';
  status?: ModuleStatus;
  category?: ModuleCategory;
  
  // New Content Fields
  lessonNote?: string;
  illustrations?: Illustration[]; // For Primary
  classLevel?: ClassLevel;
}

export interface Student {
  id: number;
  name: string;
  plays: number;
  avgScore: number;
  streak: number;
}

export interface StudentProgress {
  [moduleId: string]: {
    highScore: number;
    completed: boolean;
  };
}

export interface Session {
  session_id: string;      // The 6-digit code
  teacher_id: string;      // UID of creator
  created_at: string;      // Timestamp
  active_status: boolean;  // Boolean status
  students: string[];      // List of joined student names (kept for UI display)
  
  // Real-time Sync State
  current_module_id?: string;
  current_level_index?: number;
  sync_state: 'waiting' | 'lesson_note' | 'playing' | 'paused' | 'finished';
}