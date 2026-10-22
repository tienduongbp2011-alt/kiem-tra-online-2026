/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/common/Navbar';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ExamRoom } from './components/student/ExamRoom';
import { StudentResultModal } from './components/student/StudentResultModal';
import { TeacherLayout, TeacherView } from './components/teacher/TeacherLayout';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ExamManagement } from './components/teacher/ExamManagement';
import { QuestionBankView } from './components/teacher/QuestionBankView';
import { SubjectManagement } from './components/teacher/SubjectManagement';
import { TeacherManagement } from './components/teacher/TeacherManagement';
import { StudentManagement } from './components/teacher/StudentManagement';
import { ClassManagement } from './components/teacher/ClassManagement';
import { ExamResultsView } from './components/teacher/ExamResultsView';
import { StatisticsView } from './components/teacher/StatisticsView';
import { SettingsView } from './components/teacher/SettingsView';
import { Exam, ExamAttempt } from './types';

function MainApp() {
  const { currentUser } = useApp();

  // Student specific navigation states
  const [activeTakingExam, setActiveTakingExam] = useState<Exam | null>(null);
  const [viewingResult, setViewingResult] = useState<{
    attempt: ExamAttempt;
    exam: Exam;
  } | null>(null);

  // Teacher specific navigation state
  const [teacherView, setTeacherView] = useState<TeacherView>('DASHBOARD');
  const [teacherSelectedExamId, setTeacherSelectedExamId] = useState<string | undefined>(undefined);

  // If not logged in, show the required Home / Landing LoginPage
  if (!currentUser) {
    return <LoginPage />;
  }

  // -------------------------------------------------------------------
  // 1. STUDENT VIEW
  // -------------------------------------------------------------------
  if (currentUser.role === 'STUDENT') {
    // If student is actively taking an exam: render full-screen ExamRoom
    if (activeTakingExam) {
      return (
        <ExamRoom
          exam={activeTakingExam}
          onExit={() => setActiveTakingExam(null)}
        />
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <div>
          <Navbar onNavigateHome={() => setActiveTakingExam(null)} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <StudentDashboard
              onStartExam={(exam) => setActiveTakingExam(exam)}
              onViewResult={(attempt, exam) => setViewingResult({ attempt, exam })}
            />
          </main>
        </div>

        {/* Modal for student to review submitted exam */}
        {viewingResult && (
          <StudentResultModal
            attempt={viewingResult.attempt}
            exam={viewingResult.exam}
            onClose={() => setViewingResult(null)}
          />
        )}

        <footer className="w-full bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-12">
          <p className="font-semibold text-slate-700">KIỂM TRA ONLINE • TRƯỜNG THPT THANH HÒA • Năm học 2026–2027</p>
          <p className="mt-0.5">Hệ thống hỗ trợ thi trắc nghiệm khách quan trực tuyến</p>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // 2. TEACHER / ADMIN VIEW
  // -------------------------------------------------------------------
  return (
    <TeacherLayout
      currentView={teacherView}
      onSelectView={(v) => {
        setTeacherView(v);
      }}
    >
      {teacherView === 'DASHBOARD' && (
        <TeacherDashboard
          onNavigate={(view) => setTeacherView(view)}
          onOpenCreateExam={() => setTeacherView('EXAMS')}
          onSelectExamForResults={(examId) => {
            setTeacherSelectedExamId(examId);
            setTeacherView('RESULTS');
          }}
        />
      )}

      {teacherView === 'EXAMS' && (
        <ExamManagement
          onViewResults={(examId) => {
            setTeacherSelectedExamId(examId);
            setTeacherView('RESULTS');
          }}
        />
      )}

      {teacherView === 'QUESTIONS' && <QuestionBankView />}

      {teacherView === 'SUBJECTS' && (
        <SubjectManagement
          onNavigateToExamsWithSubject={(_subject) => setTeacherView('EXAMS')}
          onNavigateToQuestionsWithSubject={(_subject) => setTeacherView('QUESTIONS')}
        />
      )}

      {teacherView === 'TEACHERS' && <TeacherManagement />}

      {teacherView === 'STUDENTS' && <StudentManagement />}

      {teacherView === 'CLASSES' && <ClassManagement />}

      {teacherView === 'RESULTS' && (
        <ExamResultsView initialExamId={teacherSelectedExamId} />
      )}

      {teacherView === 'STATISTICS' && <StatisticsView />}

      {teacherView === 'SETTINGS' && <SettingsView />}
    </TeacherLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
