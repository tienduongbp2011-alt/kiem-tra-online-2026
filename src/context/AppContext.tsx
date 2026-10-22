import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [supabaseMessage, setSupabaseMessage] = useState<string>('Đang kiểm tra kết nối Supabase...');

  // Sync state to LocalStorage as local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.error(e);
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    } catch (e) {
      console.error(e);
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    } catch (e) {
      console.error(e);
    }
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    } catch (e) {
      console.error(e);
    }
  }, [attempts]);

  useEffect(() => {
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
        supabase.from('subjects').upsert(subjects.map(toDbSubject)),
        supabase.from('classes').upsert(classes.map(toDbClass)),
        supabase.from('users').upsert(users.map(toDbUser)),
        supabase.from('questions').upsert(questions.map(toDbQuestion)),
        supabase.from('exams').upsert(exams.map(toDbExam)),
        supabase.from('exam_attempts').upsert(attempts.map(toDbAttempt)),
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

      // If tables exist on Supabase: load non-empty tables or seed empty tables with current local data
      if (subRes.data && subRes.data.length > 0) {
        setSubjects(subRes.data.map(fromDbSubject));
      } else {
        await supabase.from('subjects').upsert(subjects.map(toDbSubject));
      }

      if (clsRes.data && clsRes.data.length > 0) {
        setClasses(clsRes.data.map(fromDbClass));
      } else {
        await supabase.from('classes').upsert(classes.map(toDbClass));
      }

      if (usrRes.data && usrRes.data.length > 0) {
        setUsers(usrRes.data.map(fromDbUser));
      } else {
        await supabase.from('users').upsert(users.map(toDbUser));
      }

      if (qRes.data && qRes.data.length > 0) {
        setQuestions(qRes.data.map(fromDbQuestion));
      } else {
        await supabase.from('questions').upsert(questions.map(toDbQuestion));
      }

      if (exRes.data && exRes.data.length > 0) {
        setExams(exRes.data.map(fromDbExam));
      } else {
        await supabase.from('exams').upsert(exams.map(toDbExam));
      }

      if (attRes.data && attRes.data.length > 0) {
        setAttempts(attRes.data.map(fromDbAttempt));
      } else if (attempts.length > 0) {
        await supabase.from('exam_attempts').upsert(attempts.map(toDbAttempt));
      }

      setSupabaseStatus('CONNECTED');
      const okMsg = 'Đã kết nối và đồng bộ dữ liệu trực tiếp với Supabase.';
      setSupabaseMessage(okMsg);
      return { success: true, message: okMsg };
    } catch (err: any) {
      setSupabaseStatus('ERROR');
      const errMsg = err?.message || 'Lỗi kết nối Supabase.';
      setSupabaseMessage(errMsg);
      return { success: false, message: errMsg };
    }
  }, []);

  // Initial load from Supabase on mount
  useEffect(() => {
    refreshFromSupabase();
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

  // Subjects
  const addSubject = (newSub: Omit<SubjectItem, 'id' | 'createdAt'>): SubjectItem => {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const created: SubjectItem = {
      ...newSub,
      id,
      createdAt: new Date().toISOString(),
    };
    setSubjects((prev) => [...prev, created]);
    supabase.from('subjects').upsert(toDbSubject(created)).then();
    return created;
  };

  const updateSubject = (id: string, updated: Partial<SubjectItem>) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...updated };
        supabase.from('subjects').upsert(toDbSubject(next)).then();
        return next;
      })
    );
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    supabase.from('subjects').delete().eq('id', id).then();
  };

  // Questions
  const addQuestion = (newQ: Omit<Question, 'id'>): Question => {
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const question: Question = { ...newQ, id, createdAt: new Date().toISOString() };
    setQuestions((prev) => [question, ...prev]);
    supabase.from('questions').upsert(toDbQuestion(question)).then();
    return question;
  };

  const updateQuestion = (id: string, updated: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const next = { ...q, ...updated };
        supabase.from('questions').upsert(toDbQuestion(next)).then();
        return next;
      })
    );
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    supabase.from('questions').delete().eq('id', id).then();
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
    supabase.from('questions').upsert(toDbQuestion(duplicated)).then();
  };

  const importQuestions = (newQuestions: Question[]): number => {
    setQuestions((prev) => [...newQuestions, ...prev]);
    if (newQuestions.length > 0) {
      supabase.from('questions').upsert(newQuestions.map(toDbQuestion)).then();
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
    supabase.from('exams').upsert(toDbExam(newExam)).then();
    return newExam;
  };

  const updateExam = (id: string, updated: Partial<Exam>) => {
    setExams((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e, ...updated };
        supabase.from('exams').upsert(toDbExam(next)).then();
        return next;
      })
    );
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    supabase.from('exams').delete().eq('id', id).then();
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
    supabase.from('exams').upsert(toDbExam(dup)).then();
  };

  const toggleExamStatus = (id: string, status?: ExamStatus) => {
    setExams((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const newStatus = status ? status : e.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        const next = { ...e, status: newStatus };
        supabase.from('exams').upsert(toDbExam(next)).then();
        return next;
      })
    );
  };

  // Classes
  const addClass = (cls: SchoolClass) => {
    setClasses((prev) => [...prev, cls]);
    supabase.from('classes').upsert(toDbClass(cls)).then();
  };

  const updateClass = (id: string, updated: Partial<SchoolClass>) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...updated };
        supabase.from('classes').upsert(toDbClass(next)).then();
        return next;
      })
    );
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    supabase.from('classes').delete().eq('id', id).then();
  };

  // Users
  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
    supabase.from('users').upsert(toDbUser(user)).then();
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const next = { ...u, ...updated };
        supabase.from('users').upsert(toDbUser(next)).then();
        return next;
      })
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    supabase.from('users').delete().eq('id', id).then();
  };

  const importUsers = (newUsers: User[]): number => {
    setUsers((prev) => {
      const existingUsernames = new Set(prev.map((u) => u.username.toLowerCase()));
      const filtered = newUsers.filter((u) => !existingUsernames.has(u.username.toLowerCase()));
      if (filtered.length > 0) {
        supabase.from('users').upsert(filtered.map(toDbUser)).then();
      }
      return [...prev, ...filtered];
    });
    return newUsers.length;
  };

  const resetUserPassword = (userId: string, newPassword = '123456') => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const next = { ...u, passwordHash: newPassword };
        supabase.from('users').upsert(toDbUser(next)).then();
        return next;
      })
    );
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
    supabase.from('exam_attempts').upsert(toDbAttempt(newAttempt)).then();
    return newAttempt;
  };

  const saveAttemptProgress = (
    attemptId: string,
    answers: Record<string, StudentAnswer>,
    timeSpentSeconds: number
  ) => {
    setAttempts((prev) =>
      prev.map((a) => {
        if (a.id !== attemptId) return a;
        const next = { ...a, answers, timeSpentSeconds };
        supabase.from('exam_attempts').upsert(toDbAttempt(next)).then();
        return next;
      })
    );
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
    supabase.from('exam_attempts').upsert(toDbAttempt(updatedAttempt)).then();
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
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);

    Promise.all([
      supabase.from('subjects').upsert(INITIAL_SUBJECTS.map(toDbSubject)),
      supabase.from('classes').upsert(INITIAL_CLASSES.map(toDbClass)),
      supabase.from('users').upsert(INITIAL_USERS.map(toDbUser)),
      supabase.from('questions').upsert(INITIAL_QUESTIONS.map(toDbQuestion)),
      supabase.from('exams').upsert(INITIAL_EXAMS.map(toDbExam)),
      supabase.from('exam_attempts').upsert(INITIAL_ATTEMPTS.map(toDbAttempt)),
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
