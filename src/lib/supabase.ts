import { createClient } from '@supabase/supabase-js';
import {
  User,
  SchoolClass,
  Question,
  Exam,
  ExamAttempt,
  SubjectItem,
} from '../types';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL || 'https://gdoxbonoiumnpiswqris.supabase.co';

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eYFPXHwHldj4nqSombGNaA_ZWDOZRON';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// MAPPERS: APPLICATION MODELS <-> SUPABASE POSTGRESQL ROWS
// ============================================================================

export const toDbSubject = (s: SubjectItem) => ({
  id: s.id,
  name: s.name,
  code: s.code,
  description: s.description || '',
  grades: s.grades || [10, 11, 12],
  created_at: s.createdAt || new Date().toISOString(),
});

export const fromDbSubject = (row: Record<string, any>): SubjectItem => ({
  id: row.id,
  name: row.name,
  code: row.code,
  description: row.description || undefined,
  grades: Array.isArray(row.grades) ? row.grades : [10, 11, 12],
  createdAt: row.created_at || undefined,
});

export const toDbClass = (c: SchoolClass) => ({
  id: c.id,
  name: c.name,
  grade: Number(c.grade),
  academic_year: c.academicYear,
  room: c.room || '',
  homeroom_teacher: c.homeroomTeacher || '',
});

export const fromDbClass = (row: Record<string, any>): SchoolClass => ({
  id: row.id,
  name: row.name,
  grade: Number(row.grade) as 10 | 11 | 12,
  academicYear: row.academic_year || '2026-2027',
  room: row.room || undefined,
  homeroomTeacher: row.homeroom_teacher || undefined,
});

export const toDbUser = (u: User) => ({
  id: u.id,
  username: u.username,
  password_hash: u.passwordHash,
  full_name: u.fullName,
  role: u.role,
  student_code: u.studentCode || null,
  class_id: u.classId || null,
  class_name: u.className || null,
  active: Boolean(u.active),
  subject: u.subject || null,
});

export const fromDbUser = (row: Record<string, any>): User => ({
  id: row.id,
  username: row.username,
  passwordHash: row.password_hash,
  fullName: row.full_name,
  role: row.role,
  studentCode: row.student_code || undefined,
  classId: row.class_id || undefined,
  className: row.class_name || undefined,
  active: row.active !== false,
  subject: row.subject || undefined,
});

export const toDbQuestion = (q: Question) => ({
  id: q.id,
  subject: q.subject,
  grade: Number(q.grade),
  chapter: q.chapter || null,
  lesson: q.lesson || null,
  topic: q.topic,
  level: q.level,
  type: q.type,
  content: q.content,
  options: q.options || null,
  tf_statements: q.tfStatements || null,
  correct_answer: q.correctAnswer,
  points: Number(q.points),
  explanation: q.explanation || null,
  created_at: q.createdAt || new Date().toISOString(),
});

export const fromDbQuestion = (row: Record<string, any>): Question => ({
  id: row.id,
  subject: row.subject,
  grade: Number(row.grade) as 10 | 11 | 12,
  chapter: row.chapter || undefined,
  lesson: row.lesson || undefined,
  topic: row.topic || '',
  level: row.level,
  type: row.type,
  content: row.content,
  options: Array.isArray(row.options) ? row.options : undefined,
  tfStatements: Array.isArray(row.tf_statements) ? row.tf_statements : undefined,
  correctAnswer: row.correct_answer || '',
  points: Number(row.points ?? 0.25),
  explanation: row.explanation || undefined,
  createdAt: row.created_at || undefined,
});

export const toDbExam = (e: Exam) => ({
  id: e.id,
  title: e.title,
  subject: e.subject,
  grade: Number(e.grade),
  class_ids: e.classIds || [],
  duration_minutes: Number(e.durationMinutes),
  start_time: e.startTime || '',
  end_time: e.endTime || '',
  question_ids: e.questionIds || [],
  questions: e.questions || [],
  total_points: Number(e.totalPoints ?? 10),
  max_attempts: Number(e.maxAttempts ?? 1),
  show_answers_after_submit: Boolean(e.showAnswersAfterSubmit),
  shuffle_questions: Boolean(e.shuffleQuestions),
  shuffle_options: Boolean(e.shuffleOptions),
  status: e.status,
  exam_code: e.examCode,
  created_by: e.createdBy || null,
  created_at: e.createdAt || new Date().toISOString(),
});

export const fromDbExam = (row: Record<string, any>): Exam => ({
  id: row.id,
  title: row.title,
  subject: row.subject,
  grade: Number(row.grade) as 10 | 11 | 12,
  classIds: Array.isArray(row.class_ids) ? row.class_ids : [],
  durationMinutes: Number(row.duration_minutes ?? 45),
  startTime: row.start_time || '',
  endTime: row.end_time || '',
  questionIds: Array.isArray(row.question_ids) ? row.question_ids : [],
  questions: Array.isArray(row.questions) ? row.questions : undefined,
  totalPoints: Number(row.total_points ?? 10),
  maxAttempts: Number(row.max_attempts ?? 1),
  showAnswersAfterSubmit: Boolean(row.show_answers_after_submit),
  shuffleQuestions: Boolean(row.shuffle_questions),
  shuffleOptions: Boolean(row.shuffle_options),
  status: row.status || 'OPEN',
  examCode: row.exam_code || '101',
  createdBy: row.created_by || undefined,
  createdAt: row.created_at || new Date().toISOString(),
});

export const toDbAttempt = (a: ExamAttempt) => ({
  id: a.id,
  exam_id: a.examId,
  exam_title: a.examTitle,
  subject: a.subject,
  student_id: a.studentId,
  student_code: a.studentCode,
  student_name: a.studentName,
  class_name: a.className,
  started_at: a.startedAt,
  submitted_at: a.submittedAt || null,
  time_spent_seconds: Number(a.timeSpentSeconds ?? 0),
  is_submitted: Boolean(a.isSubmitted),
  score: Number(a.score ?? 0),
  max_score: Number(a.maxScore ?? 10),
  correct_count: Number(a.correctCount ?? 0),
  wrong_count: Number(a.wrongCount ?? 0),
  answers: a.answers || {},
});

export const fromDbAttempt = (row: Record<string, any>): ExamAttempt => ({
  id: row.id,
  examId: row.exam_id,
  examTitle: row.exam_title,
  subject: row.subject,
  studentId: row.student_id,
  studentCode: row.student_code,
  studentName: row.student_name,
  className: row.class_name,
  startedAt: row.started_at,
  submittedAt: row.submitted_at || undefined,
  timeSpentSeconds: Number(row.time_spent_seconds ?? 0),
  isSubmitted: Boolean(row.is_submitted),
  score: Number(row.score ?? 0),
  maxScore: Number(row.max_score ?? 10),
  correctCount: Number(row.correct_count ?? 0),
  wrongCount: Number(row.wrong_count ?? 0),
  answers: row.answers || {},
});

// ============================================================================
// SQL SCRIPT FOR CREATING TABLES IN SUPABASE SQL EDITOR
// ============================================================================

export const SUPABASE_INIT_SQL = `-- CHẠY ĐOẠN MÃ SQL NÀY TRONG MỤC "SQL EDITOR" CỦA SUPABASE ĐỂ TẠO ĐẦY ĐỦ 6 BẢNG

CREATE TABLE IF NOT EXISTS public.subjects (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  grades jsonb DEFAULT '[10, 11, 12]'::jsonb,
  created_at text
);

CREATE TABLE IF NOT EXISTS public.classes (
  id text PRIMARY KEY,
  name text NOT NULL,
  grade integer NOT NULL,
  academic_year text NOT NULL,
  room text,
  homeroom_teacher text
);

CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  student_code text,
  class_id text,
  class_name text,
  active boolean DEFAULT true,
  subject text
);

CREATE TABLE IF NOT EXISTS public.questions (
  id text PRIMARY KEY,
  subject text NOT NULL,
  grade integer NOT NULL,
  chapter text,
  lesson text,
  topic text NOT NULL,
  level text NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  options jsonb,
  tf_statements jsonb,
  correct_answer text NOT NULL,
  points numeric DEFAULT 0.25,
  explanation text,
  created_at text
);

CREATE TABLE IF NOT EXISTS public.exams (
  id text PRIMARY KEY,
  title text NOT NULL,
  subject text NOT NULL,
  grade integer NOT NULL,
  class_ids jsonb DEFAULT '[]'::jsonb,
  duration_minutes integer NOT NULL,
  start_time text,
  end_time text,
  question_ids jsonb DEFAULT '[]'::jsonb,
  questions jsonb DEFAULT '[]'::jsonb,
  total_points numeric DEFAULT 10,
  max_attempts integer DEFAULT 1,
  show_answers_after_submit boolean DEFAULT true,
  shuffle_questions boolean DEFAULT false,
  shuffle_options boolean DEFAULT false,
  status text NOT NULL,
  exam_code text NOT NULL,
  created_by text,
  created_at text
);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id text PRIMARY KEY,
  exam_id text NOT NULL,
  exam_title text NOT NULL,
  subject text NOT NULL,
  student_id text NOT NULL,
  student_code text NOT NULL,
  student_name text NOT NULL,
  class_name text NOT NULL,
  started_at text NOT NULL,
  submitted_at text,
  time_spent_seconds integer DEFAULT 0,
  is_submitted boolean DEFAULT false,
  score numeric DEFAULT 0,
  max_score numeric DEFAULT 10,
  correct_count integer DEFAULT 0,
  wrong_count integer DEFAULT 0,
  answers jsonb DEFAULT '{}'::jsonb
);

-- Bật quyền truy cập dữ liệu (RLS Policies) cho ứng dụng
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access subjects" ON public.subjects;
CREATE POLICY "Allow public access subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access classes" ON public.classes;
CREATE POLICY "Allow public access classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access users" ON public.users;
CREATE POLICY "Allow public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access questions" ON public.questions;
CREATE POLICY "Allow public access questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access exams" ON public.exams;
CREATE POLICY "Allow public access exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access exam_attempts" ON public.exam_attempts;
CREATE POLICY "Allow public access exam_attempts" ON public.exam_attempts FOR ALL USING (true) WITH CHECK (true);
`;
