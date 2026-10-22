export type Role = 'TEACHER' | 'STUDENT' | 'ADMIN';

export type QuestionLevel = 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export interface TrueFalseStatement {
  key: 'a' | 'b' | 'c' | 'd';
  content: string;
  isCorrect: boolean; // true = Đúng, false = Sai
}

export interface Question {
  id: string;
  subject: string;
  grade: 10 | 11 | 12;
  chapter?: string;
  lesson?: string;
  topic: string;
  level: QuestionLevel;
  type: QuestionType;
  content: string;
  options?: {
    key: 'A' | 'B' | 'C' | 'D';
    content: string;
  }[];
  tfStatements?: TrueFalseStatement[];
  correctAnswer: string; // for MC: 'A'|'B'|'C'|'D', for ShortAnswer: '8' or '12.5'
  points: number;
  explanation?: string;
  createdAt?: string;
}

export type ExamStatus = 'OPEN' | 'CLOSED' | 'SCHEDULED' | 'DRAFT';

export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: 10 | 11 | 12;
  classIds: string[]; // e.g. ['12A1', '12A2'] or ['ALL']
  durationMinutes: number;
  startTime: string; // ISO string or datetime-local
  endTime: string;
  questionIds: string[];
  questions?: Question[]; // Snapshot of questions at creation
  totalPoints: number;
  maxAttempts: number;
  showAnswersAfterSubmit: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  status: ExamStatus;
  examCode: string; // e.g. "101", "102"
  createdBy?: string;
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  selectedOption?: string; // For MULTIPLE_CHOICE ('A'|'B'|'C'|'D')
  tfSelections?: {
    a?: boolean; // true for Đúng, false for Sai
    b?: boolean;
    c?: boolean;
    d?: boolean;
  };
  shortAnswerText?: string;
  isFlagged?: boolean; // Đánh dấu xem lại
  scoreAwarded?: number;
  isCorrect?: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  startedAt: string;
  submittedAt?: string;
  timeSpentSeconds: number;
  isSubmitted: boolean;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  answers: Record<string, StudentAnswer>;
}

export interface User {
  id: string;
  username: string; // Student code or teacher username
  passwordHash: string; // Stored hashed/salted string
  fullName: string;
  role: Role;
  studentCode?: string;
  classId?: string;
  className?: string;
  active: boolean;
  subject?: string; // For teachers
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "12A1"
  grade: 10 | 11 | 12;
  academicYear: string;
  room?: string;
  homeroomTeacher?: string;
}

export interface WordImportResult {
  questions: Question[];
  errors: {
    line: number;
    message: string;
    snippet?: string;
  }[];
  rawText: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  grades?: (10 | 11 | 12)[];
  createdAt?: string;
}
