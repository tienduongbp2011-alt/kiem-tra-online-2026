import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  SchoolClass,
  Question,
  Exam,
  ExamAttempt,
  ExamStatus,
  StudentAnswer,
  SubjectItem,
} from '../types';
import {
  INITIAL_CLASSES,
  INITIAL_USERS,
  INITIAL_QUESTIONS,
  INITIAL_EXAMS,
  INITIAL_ATTEMPTS,
  INITIAL_SUBJECTS,
} from '../data/initialData';
import { gradeQuestion } from '../utils/scoring';
import {
  supabase,
  toDbSubject,
  fromDbSubject,
  toDbClass,
  fromDbClass,
  toDbUser,
  fromDbUser,
  toDbQuestion,
  fromDbQuestion,
  toDbExam,
  fromDbExam,
  toDbAttempt,
  fromDbAttempt,
} from '../lib/supabase';

export type SupabaseConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'NEEDS_TABLES' | 'ERROR';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  classes: SchoolClass[];
  questions: Question[];
  exams: Exam[];
  attempts: ExamAttempt[];
  subjects: SubjectItem[];
  supabaseStatus: SupabaseConnectionStatus;
  supabaseMessage: string;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string }>;
  refreshFromSupabase: () => Promise<{ success: boolean; message: string }>;
  login: (username: string, password: string) => { success: boolean; message?: string; user?: User };
  logout: () => void;
  // Subjects
  addSubject: (subject: Omit<SubjectItem, 'id' | 'createdAt'>) => SubjectItem;
  updateSubject: (id: string, updated: Partial<SubjectItem>) => void;
  deleteSubject: (id: string) => void;
  // Questions
  addQuestion: (question: Omit<Question, 'id'>) => Question;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  duplicateQuestion: (id: string) => void;
  importQuestions: (newQuestions: Question[]) => number;
  // Exams
  createExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Exam;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  duplicateExam: (id: string) => void;
  toggleExamStatus: (id: string, status?: ExamStatus) => void;
  // Classes
  addClass: (cls: SchoolClass) => void;
  updateClass: (id: string, cls: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;
  // Users
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  importUsers: (users: User[]) => number;
  resetUserPassword: (userId: string, newPassword?: string) => void;
  // Exam Flow
  startExamAttempt: (examId: string, student: User) => ExamAttempt;
  saveAttemptProgress: (
    attemptId: string,
    answers: Record<string, StudentAnswer>,
    timeSpentSeconds: number
  ) => void;
  submitExamAttempt: (
    attemptId: string,
    answers: Record<string, StudentAnswer>,
    timeSpentSeconds: number
  ) => ExamAttempt;
  getAttemptsForExam: (examId: string) => ExamAttempt[];
  getAttemptsForStudent: (studentId: string) => ExamAttempt[];
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'kiemtra_users_v1',
  CLASSES: 'kiemtra_classes_v1',
  QUESTIONS: 'kiemtra_questions_v1',
  EXAMS: 'kiemtra_exams_v1',
  ATTEMPTS: 'kiemtra_attempts_v1',
  SUBJECTS: 'kiemtra_subjects_v1',
  CURRENT_USER: 'kiemtra_current_user_v1',
};

// Helper to synchronize a complete table (upserts current rows and deletes removed rows)
async function syncTableExact(tableName: string, dbRows: Record<string, any>[]) {
  const existingRes = await supabase.from(tableName).select('id');
  if (existingRes.error) return existingRes;

  const currentIds = new Set(dbRows.map((r) => r.id));
  const idsToDelete = (existingRes.data || [])
    .map((r: { id: string }) => r.id)
    .filter((id: string) => !currentIds.has(id));

  if (idsToDelete.length > 0) {
    const delRes = await supabase.from(tableName).delete().in('id', idsToDelete);
    if (delRes.error) return delRes;
  }

  if (dbRows.length > 0) {
    const upRes = await supabase.from(tableName).upsert(dbRows, { onConflict: 'id' });
    if (upRes.error) return upRes;
  }

  return { error: null };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return stored ? JSON.parse(stored) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      return stored ? JSON.parse(stored) : INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXAMS);
      return stored ? JSON.parse(stored) : INITIAL_EXAMS;
    } catch {
      return INITIAL_EXAMS;
    }
  });

  const [attempts, setAttempts] = useState<ExamAttempt[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      return stored ? JSON.parse(stored) : INITIAL_ATTEMPTS;
    } catch {
      return INITIAL_ATTEMPTS;
    }
  });

  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      return stored ? JSON.parse(stored) : INITIAL_SUBJECTS;
    } catch {
      return INITIAL_SUBJECTS;
    }
  });

  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>('CONNECTING');
  const [supabaseMessage, setSupabaseMessage] = useState<string>('Đang tải dữ liệu từ Supabase...');
  const isHydratedRef = useRef(false);

  // Sync currentUser to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Only write data caches to localStorage AFTER initial Supabase fetch completes
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.error(e);
    }
  }, [classes]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    } catch (e) {
      console.error(e);
    }
  }, [questions]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    } catch (e) {
      console.error(e);
    }
  }, [exams]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    } catch (e) {
      console.error(e);
    }
  }, [attempts]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.error(e);
    }
  }, [subjects]);

  // ==========================================================================
  // SUPABASE CLOUD SYNC FUNCTIONS
  // ==========================================================================

  const syncAllToSupabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const [subRes, clsRes, usrRes, qRes, exRes, attRes] = await Promise.all([
        syncTableExact('subjects', subjects.map(toDbSubject)),
        syncTableExact('classes', classes.map(toDbClass)),
        syncTableExact('users', users.map(toDbUser)),
        syncTableExact('questions', questions.map(toDbQuestion)),
        syncTableExact('exams', exams.map(toDbExam)),
        syncTableExact('exam_attempts', attempts.map(toDbAttempt)),
      ]);

      const firstError =
        subRes.error || clsRes.error || usrRes.error || qRes.error || exRes.error || attRes.error;

      if (firstError) {
        const isMissingTable =
          firstError.code === '42P01' ||
          firstError.code === 'PGRST205' ||
          firstError.message.includes('relation') ||
          firstError.message.includes('schema cache');

        if (isMissingTable) {
          setSupabaseStatus('NEEDS_TABLES');
          const msg =
            'Đã kết nối tới Supabase nhưng chưa có các bảng dữ liệu. Vui lòng copy mã SQL trong phần Cài đặt hệ thống và chạy trong SQL Editor của Supabase.';
          setSupabaseMessage(msg);
          return { success: false, message: msg };
        }

        setSupabaseStatus('ERROR');
        setSupabaseMessage(`Lỗi đồng bộ Supabase: ${firstError.message}`);
        return { success: false, message: firstError.message };
      }

      setSupabaseStatus('CONNECTED');
      const okMsg = `Đã đồng bộ thành công toàn bộ dữ liệu lên Supabase (${questions.length} câu hỏi, ${exams.length} đề thi, ${users.length} tài khoản).`;
      setSupabaseMessage(okMsg);
      return { success: true, message: okMsg };
    } catch (err: any) {
      setSupabaseStatus('ERROR');
      const errMsg = err?.message || 'Không thể kết nối tới Supabase.';
      setSupabaseMessage(errMsg);
      return { success: false, message: errMsg };
    }
  }, [subjects, classes, users, questions, exams, attempts]);

  const refreshFromSupabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      setSupabaseStatus('CONNECTING');
      const [subRes, clsRes, usrRes, qRes, exRes, attRes] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('users').select('*'),
        supabase.from('questions').select('*'),
        supabase.from('exams').select('*'),
        supabase.from('exam_attempts').select('*'),
      ]);

      const firstError =
        subRes.error || clsRes.error || usrRes.error || qRes.error || exRes.error || attRes.error;

      if (firstError) {
        isHydratedRef.current = true;
        const isMissingTable =
          firstError.code === '42P01' ||
          firstError.code === 'PGRST205' ||
          firstError.message.includes('relation') ||
          firstError.message.includes('schema cache') ||
          firstError.message.includes('Could not find the table');

        if (isMissingTable) {
          setSupabaseStatus('NEEDS_TABLES');
          const msg =
            'Đã kết nối tới Supabase nhưng các bảng dữ liệu chưa được tạo. Hãy vào mục "Cài đặt hệ thống" để lấy mã SQL tạo bảng trên Supabase.';
          setSupabaseMessage(msg);
          return { success: false, message: msg };
        }

        setSupabaseStatus('ERROR');
        setSupabaseMessage(`Lỗi truy vấn Supabase: ${firstError.message}`);
        return { success: false, message: firstError.message };
      }

      const subRows = subRes.data || [];
      const clsRows = clsRes.data || [];
      const usrRows = usrRes.data || [];
      const qRows = qRes.data || [];
      const exRows = exRes.data || [];
      const attRows = attRes.data || [];

      const totalCloudRows =
        subRows.length +
        clsRows.length +
        usrRows.length +
        qRows.length +
        exRows.length +
        attRows.length;

      // Only seed initial sample data if the ENTIRE Supabase database is 100% empty (0 rows across all 6 tables)
      if (totalCloudRows === 0) {
        await Promise.all([
          supabase.from('subjects').upsert(INITIAL_SUBJECTS.map(toDbSubject)),
          supabase.from('classes').upsert(INITIAL_CLASSES.map(toDbClass)),
          supabase.from('users').upsert(INITIAL_USERS.map(toDbUser)),
          supabase.from('questions').upsert(INITIAL_QUESTIONS.map(toDbQuestion)),
          supabase.from('exams').upsert(INITIAL_EXAMS.map(toDbExam)),
          supabase.from('exam_attempts').upsert(INITIAL_ATTEMPTS.map(toDbAttempt)),
        ]);
        setSubjects(INITIAL_SUBJECTS);
        setClasses(INITIAL_CLASSES);
        setUsers(INITIAL_USERS);
        setQuestions(INITIAL_QUESTIONS);
        setExams(INITIAL_EXAMS);
        setAttempts(INITIAL_ATTEMPTS);
      } else {
        // Use Supabase as the exact single source of truth (even if user deleted all rows in a specific table!)
        const loadedSubjects = subRows.map(fromDbSubject);
        const loadedClasses = clsRows.map(fromDbClass);
        const loadedUsers = usrRows.map(fromDbUser);
        const loadedQuestions = qRows.map(fromDbQuestion);
        const loadedExams = exRows.map(fromDbExam);
        const loadedAttempts = attRows.map(fromDbAttempt);

        setSubjects(loadedSubjects);
        setClasses(loadedClasses);
        setUsers(loadedUsers);
        setQuestions(loadedQuestions);
        setExams(loadedExams);
        setAttempts(loadedAttempts);

        // Immediately overwrite localStorage with the exact cloud data
        try {
          localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(loadedSubjects));
          localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(loadedClasses));
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(loadedUsers));
          localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(loadedQuestions));
          localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(loadedExams));
          localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(loadedAttempts));
        } catch (e) {
          console.error(e);
        }
      }

      isHydratedRef.current = true;
      setSupabaseStatus('CONNECTED');
      const okMsg = `Đã đồng bộ trực tiếp từ Supabase (${qRows.length} câu hỏi, ${exRows.length} đề thi, ${usrRows.length} tài khoản, ${clsRows.length} lớp).`;
      setSupabaseMessage(okMsg);
      return { success: true, message: okMsg };
    } catch (err: any) {
      isHydratedRef.current = true;
      setSupabaseStatus('ERROR');
      const errMsg = err?.message || 'Lỗi kết nối Supabase.';
      setSupabaseMessage(errMsg);
      return { success: false, message: errMsg };
    }
  }, []);

  // Initial load from Supabase on mount + re-sync on window focus
  useEffect(() => {
    refreshFromSupabase();

    const handleFocus = () => {
      refreshFromSupabase();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshFromSupabase]);

  const login = (username: string, password: string) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const found = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanUser ||
          (u.studentCode && u.studentCode.toLowerCase() === cleanUser)) &&
        u.passwordHash === cleanPass
    );

    if (!found) {
      return {
        success: false,
        message: 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại.',
      };
    }

    if (!found.active) {
      return {
        success: false,
        message: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ giáo viên quản trị.',
      };
    }

    setCurrentUser(found);
    return { success: true, user: found };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // ==========================================================================
  // CRUD OPERATIONS (STATE + SUPABASE PERSISTENCE)
  // ==========================================================================

  // Subjects
  const addSubject = (newSub: Omit<SubjectItem, 'id' | 'createdAt'>): SubjectItem => {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const created: SubjectItem = {
      ...newSub,
      id,
      createdAt: new Date().toISOString(),
    };
    setSubjects((prev) => [...prev, created]);
    supabase
      .from('subjects')
      .upsert(toDbSubject(created), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase addSubject error:', error);
      });
    return created;
  };

  const updateSubject = (id: string, updated: Partial<SubjectItem>) => {
    const existing = subjects.find((s) => s.id === id);
    if (!existing) return;
    const next: SubjectItem = { ...existing, ...updated };
    setSubjects((prev) => prev.map((s) => (s.id === id ? next : s)));
    supabase
      .from('subjects')
      .upsert(toDbSubject(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase updateSubject error:', error);
      });
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Supabase deleteSubject error:', error);
      });
  };

  // Questions
  const addQuestion = (newQ: Omit<Question, 'id'>): Question => {
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const question: Question = { ...newQ, id, createdAt: new Date().toISOString() };
    setQuestions((prev) => [question, ...prev]);
    supabase
      .from('questions')
      .upsert(toDbQuestion(question), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase addQuestion error:', error);
      });
    return question;
  };

  const updateQuestion = (id: string, updated: Partial<Question>) => {
    const existing = questions.find((q) => q.id === id);
    if (!existing) return;
    const next: Question = { ...existing, ...updated };
    setQuestions((prev) => prev.map((q) => (q.id === id ? next : q)));
    supabase
      .from('questions')
      .upsert(toDbQuestion(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase updateQuestion error:', error);
      });
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    supabase
      .from('questions')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Supabase deleteQuestion error:', error);
      });
  };

  const duplicateQuestion = (id: string) => {
    const orig = questions.find((q) => q.id === id);
    if (!orig) return;
    const duplicated: Question = {
      ...orig,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      content: `${orig.content} (Bản sao)`,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) => [duplicated, ...prev]);
    supabase
      .from('questions')
      .upsert(toDbQuestion(duplicated), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase duplicateQuestion error:', error);
      });
  };

  const importQuestions = (newQuestions: Question[]): number => {
    setQuestions((prev) => [...newQuestions, ...prev]);
    if (newQuestions.length > 0) {
      supabase
        .from('questions')
        .upsert(newQuestions.map(toDbQuestion), { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('Supabase importQuestions error:', error);
        });
    }
    return newQuestions.length;
  };

  // Exams
  const createExam = (examData: Omit<Exam, 'id' | 'createdAt'>): Exam => {
    const id = `exam_${Date.now()}`;
    const newExam: Exam = {
      ...examData,
      id,
      createdAt: new Date().toISOString(),
    };
    setExams((prev) => [newExam, ...prev]);
    supabase
      .from('exams')
      .upsert(toDbExam(newExam), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase createExam error:', error);
      });
    return newExam;
  };

  const updateExam = (id: string, updated: Partial<Exam>) => {
    const existing = exams.find((e) => e.id === id);
    if (!existing) return;
    const next: Exam = { ...existing, ...updated };
    setExams((prev) => prev.map((e) => (e.id === id ? next : e)));
    supabase
      .from('exams')
      .upsert(toDbExam(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase updateExam error:', error);
      });
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    supabase
      .from('exams')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Supabase deleteExam error:', error);
      });
  };

  const duplicateExam = (id: string) => {
    const orig = exams.find((e) => e.id === id);
    if (!orig) return;
    const dup: Exam = {
      ...orig,
      id: `exam_${Date.now()}`,
      title: `${orig.title} (Bản sao)`,
      examCode: `${orig.examCode}-COPY`,
      createdAt: new Date().toISOString(),
    };
    setExams((prev) => [dup, ...prev]);
    supabase
      .from('exams')
      .upsert(toDbExam(dup), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase duplicateExam error:', error);
      });
  };

  const toggleExamStatus = (id: string, status?: ExamStatus) => {
    const existing = exams.find((e) => e.id === id);
    if (!existing) return;
    const newStatus: ExamStatus = status ? status : existing.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const next: Exam = { ...existing, status: newStatus };
    setExams((prev) => prev.map((e) => (e.id === id ? next : e)));
    supabase
      .from('exams')
      .upsert(toDbExam(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase toggleExamStatus error:', error);
      });
  };

  // Classes
  const addClass = (cls: SchoolClass) => {
    setClasses((prev) => [...prev, cls]);
    supabase
      .from('classes')
      .upsert(toDbClass(cls), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase addClass error:', error);
      });
  };

  const updateClass = (id: string, updated: Partial<SchoolClass>) => {
    const existing = classes.find((c) => c.id === id);
    if (!existing) return;
    const next: SchoolClass = { ...existing, ...updated };
    setClasses((prev) => prev.map((c) => (c.id === id ? next : c)));
    supabase
      .from('classes')
      .upsert(toDbClass(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase updateClass error:', error);
      });
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    supabase
      .from('classes')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Supabase deleteClass error:', error);
      });
  };

  // Users
  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
    supabase
      .from('users')
      .upsert(toDbUser(user), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase addUser error:', error);
      });
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    const existing = users.find((u) => u.id === id);
    if (!existing) return;
    const next: User = { ...existing, ...updated };
    setUsers((prev) => prev.map((u) => (u.id === id ? next : u)));
    supabase
      .from('users')
      .upsert(toDbUser(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase updateUser error:', error);
      });
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    supabase
      .from('users')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Supabase deleteUser error:', error);
      });
  };

  const importUsers = (newUsers: User[]): number => {
    const existingUsernames = new Set(users.map((u) => u.username.toLowerCase()));
    const filtered = newUsers.filter((u) => !existingUsernames.has(u.username.toLowerCase()));
    if (filtered.length > 0) {
      setUsers((prev) => [...prev, ...filtered]);
      supabase
        .from('users')
        .upsert(filtered.map(toDbUser), { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('Supabase importUsers error:', error);
        });
    }
    return filtered.length;
  };

  const resetUserPassword = (userId: string, newPassword = '123456') => {
    const existing = users.find((u) => u.id === userId);
    if (!existing) return;
    const next: User = { ...existing, passwordHash: newPassword };
    setUsers((prev) => prev.map((u) => (u.id === userId ? next : u)));
    supabase
      .from('users')
      .upsert(toDbUser(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase resetUserPassword error:', error);
      });
  };

  // Exam Attempt Management
  const startExamAttempt = (examId: string, student: User): ExamAttempt => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) throw new Error('Không tìm thấy bài kiểm tra');

    const existing = attempts.find(
      (a) => a.examId === examId && a.studentId === student.id && !a.isSubmitted
    );
    if (existing) {
      return existing;
    }

    const newAttempt: ExamAttempt = {
      id: `att_${Date.now()}_${student.studentCode || student.username}`,
      examId: exam.id,
      examTitle: exam.title,
      subject: exam.subject,
      studentId: student.id,
      studentCode: student.studentCode || student.username,
      studentName: student.fullName,
      className: student.className || 'Chưa xếp lớp',
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 0,
      isSubmitted: false,
      score: 0,
      maxScore: exam.totalPoints || 10,
      correctCount: 0,
      wrongCount: 0,
      answers: {},
    };

    setAttempts((prev) => [newAttempt, ...prev]);
    supabase
      .from('exam_attempts')
      .upsert(toDbAttempt(newAttempt), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase startExamAttempt error:', error);
      });
    return newAttempt;
  };

  const saveAttemptProgress = (
    attemptId: string,
    answers: Record<string, StudentAnswer>,
    timeSpentSeconds: number
  ) => {
    const existing = attempts.find((a) => a.id === attemptId);
    if (!existing) return;
    const next: ExamAttempt = { ...existing, answers, timeSpentSeconds };
    setAttempts((prev) => prev.map((a) => (a.id === attemptId ? next : a)));
    supabase
      .from('exam_attempts')
      .upsert(toDbAttempt(next), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase saveAttemptProgress error:', error);
      });
  };

  const submitExamAttempt = (
    attemptId: string,
    answers: Record<string, StudentAnswer>,
    timeSpentSeconds: number
  ): ExamAttempt => {
    const existing = attempts.find((a) => a.id === attemptId);
    if (!existing) throw new Error('Không tìm thấy bài làm');

    const exam = exams.find((e) => e.id === existing.examId);
    const questionsToGrade: Question[] =
      exam?.questions || questions.filter((q) => exam?.questionIds.includes(q.id));

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const gradedAnswers: Record<string, StudentAnswer> = {};

    questionsToGrade.forEach((q) => {
      const studentAns = answers[q.id];
      const result = gradeQuestion(q, studentAns);

      totalScore += result.scoreAwarded;
      if (result.isCorrect) {
        correctCount += 1;
      } else {
        wrongCount += 1;
      }

      gradedAnswers[q.id] = {
        ...(studentAns || { questionId: q.id, type: q.type }),
        scoreAwarded: result.scoreAwarded,
        isCorrect: result.isCorrect,
      };
    });

    const finalScore = Math.min(10, Math.round(totalScore * 100) / 100);

    const updatedAttempt: ExamAttempt = {
      ...existing,
      submittedAt: new Date().toISOString(),
      timeSpentSeconds,
      isSubmitted: true,
      score: finalScore,
      maxScore: exam?.totalPoints || 10,
      correctCount,
      wrongCount,
      answers: gradedAnswers,
    };

    setAttempts((prev) => prev.map((a) => (a.id === attemptId ? updatedAttempt : a)));
    supabase
      .from('exam_attempts')
      .upsert(toDbAttempt(updatedAttempt), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Supabase submitExamAttempt error:', error);
      });
    return updatedAttempt;
  };

  const getAttemptsForExam = (examId: string) => {
    return attempts.filter((a) => a.examId === examId);
  };

  const getAttemptsForStudent = (studentId: string) => {
    return attempts.filter((a) => a.studentId === studentId);
  };

  const resetToSampleData = () => {
    setClasses(INITIAL_CLASSES);
    setUsers(INITIAL_USERS);
    setQuestions(INITIAL_QUESTIONS);
    setExams(INITIAL_EXAMS);
    setAttempts(INITIAL_ATTEMPTS);
    setSubjects(INITIAL_SUBJECTS);

    Promise.all([
      syncTableExact('subjects', INITIAL_SUBJECTS.map(toDbSubject)),
      syncTableExact('classes', INITIAL_CLASSES.map(toDbClass)),
      syncTableExact('users', INITIAL_USERS.map(toDbUser)),
      syncTableExact('questions', INITIAL_QUESTIONS.map(toDbQuestion)),
      syncTableExact('exams', INITIAL_EXAMS.map(toDbExam)),
      syncTableExact('exam_attempts', INITIAL_ATTEMPTS.map(toDbAttempt)),
    ]).then();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        classes,
        questions,
        exams,
        attempts,
        subjects,
        supabaseStatus,
        supabaseMessage,
        syncAllToSupabase,
        refreshFromSupabase,
        login,
        logout,
        addSubject,
        updateSubject,
        deleteSubject,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        importQuestions,
        createExam,
        updateExam,
        deleteExam,
        duplicateExam,
        toggleExamStatus,
        addClass,
        updateClass,
        deleteClass,
        addUser,
        updateUser,
        deleteUser,
        importUsers,
        resetUserPassword,
        startExamAttempt,
        saveAttemptProgress,
        submitExamAttempt,
        getAttemptsForExam,
        getAttemptsForStudent,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
