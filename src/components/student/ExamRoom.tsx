import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam, Question, StudentAnswer, ExamAttempt } from '../../types';
import confetti from 'canvas-confetti';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  WifiOff,
  Wifi,
  Sparkles,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';

interface ExamRoomProps {
  exam: Exam;
  onExit: () => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({ exam, onExit }) => {
  const { currentUser, questions: allQuestions, startExamAttempt, saveAttemptProgress, submitExamAttempt } = useApp();

  // Resolved list of questions for this exam
  const questions: Question[] = useMemo(() => {
    if (exam.questions && exam.questions.length > 0) return exam.questions;
    return allQuestions.filter((q) => exam.questionIds.includes(q.id));
  }, [exam, allQuestions]);

  // Current Attempt
  const [attempt, setAttempt] = useState<ExamAttempt>(() => {
    return startExamAttempt(exam.id, currentUser!);
  });

  // Current active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Answers map (local fast state backed by local storage and synced with context)
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>(() => {
    // Attempt local storage cache key
    const cacheKey = `exam_cache_${exam.id}_${currentUser?.id}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error(e);
    }
    return attempt.answers || {};
  });

  // Time remaining in seconds
  const totalSeconds = exam.durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const elapsed = attempt.timeSpentSeconds || 0;
    const remaining = totalSeconds - elapsed;
    return remaining > 0 ? remaining : totalSeconds;
  });

  // Connection & sync state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] = useState<ExamAttempt | null>(
    attempt.isSubmitted ? attempt : null
  );

  // Submit confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Auto-save interval ref
  const timerRef = useRef<any>(null);
  const autoSaveRef = useRef<any>(null);

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage whenever answers change
  useEffect(() => {
    if (submittedAttempt) return;
    const cacheKey = `exam_cache_${exam.id}_${currentUser?.id}`;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(answers));
    } catch (e) {
      console.error(e);
    }
  }, [answers, exam.id, currentUser, submittedAttempt]);

  // Periodic auto-save to AppContext / storage every 5 seconds
  useEffect(() => {
    if (submittedAttempt) return;

    autoSaveRef.current = setInterval(() => {
      const timeSpent = totalSeconds - secondsRemaining;
      saveAttemptProgress(attempt.id, answers, timeSpent);
    }, 5000);

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [attempt.id, answers, secondsRemaining, totalSeconds, saveAttemptProgress, submittedAttempt]);

  // Real-time Countdown timer
  useEffect(() => {
    if (submittedAttempt) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submittedAttempt]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine answered status of question
  const isQuestionAnswered = (q: Question) => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.type === 'MULTIPLE_CHOICE') {
      return !!ans.selectedOption;
    }
    if (q.type === 'TRUE_FALSE') {
      const tf = ans.tfSelections;
      if (!tf) return false;
      // Answered if at least one choice is made, or fully answered if 4 choices
      return (
        typeof tf.a === 'boolean' ||
        typeof tf.b === 'boolean' ||
        typeof tf.c === 'boolean' ||
        typeof tf.d === 'boolean'
      );
    }
    if (q.type === 'SHORT_ANSWER') {
      return !!(ans.shortAnswerText && ans.shortAnswerText.trim().length > 0);
    }
    return false;
  };

  // Count answered vs unanswered
  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;
  const unansweredCount = questions.length - answeredCount;

  // Handle Answer Changes
  const handleSelectMC = (optionKey: string) => {
    const currQ = questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currQ.id]: {
        ...(prev[currQ.id] || { questionId: currQ.id, type: 'MULTIPLE_CHOICE' }),
        selectedOption: optionKey,
      },
    }));
  };

  const handleSelectTF = (subKey: 'a' | 'b' | 'c' | 'd', val: boolean) => {
    const currQ = questions[currentIndex];
    const prevAns = answers[currQ.id];
    const prevTf = prevAns?.tfSelections || {};
    setAnswers((prev) => ({
      ...prev,
      [currQ.id]: {
        ...(prevAns || { questionId: currQ.id, type: 'TRUE_FALSE' }),
        tfSelections: {
          ...prevTf,
          [subKey]: val,
        },
      },
    }));
  };

  const handleShortAnswerChange = (val: string) => {
    const currQ = questions[currentIndex];
    setAnswers((prev) => ({
      ...prev,
      [currQ.id]: {
        ...(prev[currQ.id] || { questionId: currQ.id, type: 'SHORT_ANSWER' }),
        shortAnswerText: val,
      },
    }));
  };

  const handleToggleFlag = () => {
    const currQ = questions[currentIndex];
    const prevAns = answers[currQ.id];
    const isCurrentlyFlagged = !!prevAns?.isFlagged;
    setAnswers((prev) => ({
      ...prev,
      [currQ.id]: {
        ...(prevAns || { questionId: currQ.id, type: currQ.type }),
        isFlagged: !isCurrentlyFlagged,
      },
    }));
  };

  // Submission handler
  const doSubmit = () => {
    setIsSubmitting(true);
    setShowSubmitModal(false);
    const timeSpent = totalSeconds - secondsRemaining;
    const final = submitExamAttempt(attempt.id, answers, timeSpent);
    setSubmittedAttempt(final);
    setIsSubmitting(false);

    // Clear local cache for this exam
    try {
      localStorage.removeItem(`exam_cache_${exam.id}_${currentUser?.id}`);
    } catch (e) {
      console.error(e);
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleAutoSubmit = () => {
    if (!submittedAttempt) {
      doSubmit();
    }
  };

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const isFlagged = !!currentAnswer?.isFlagged;

  // -------------------------------------------------------------
  // POST-SUBMISSION RESULTS VIEW
  // -------------------------------------------------------------
  if (submittedAttempt) {
    const spentMinutes = Math.floor((submittedAttempt.timeSpentSeconds || 0) / 60);
    const spentSeconds = (submittedAttempt.timeSpentSeconds || 0) % 60;
    const isHigh = submittedAttempt.score >= 8;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#0D47A1] text-white p-8 text-center relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm text-emerald-400 mb-3 border border-white/20">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ĐÃ NỘP BÀI THÀNH CÔNG
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Hệ thống đã tự động chấm điểm và lưu kết quả bài làm vào cơ sở dữ liệu
            </p>
          </div>

          {/* Student & Exam Info Summary as requested */}
          <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Họ và tên:</span>
                <span className="text-base font-extrabold text-slate-800">{submittedAttempt.studentName}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Lớp:</span>
                <span className="text-base font-extrabold text-[#0D47A1]">{submittedAttempt.className}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Tên bài:</span>
                <span className="text-base font-bold text-slate-800 line-clamp-1">{submittedAttempt.examTitle}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Thời gian làm bài:</span>
                <span className="text-base font-extrabold text-slate-800">
                  {spentMinutes} phút {spentSeconds.toString().padStart(2, '0')} giây
                </span>
              </div>
            </div>

            {/* Score Showcase */}
            <div className="mt-6 bg-gradient-to-br from-blue-900 to-[#0D47A1] text-white rounded-2xl p-6 text-center shadow-md">
              <div className="text-sm font-bold uppercase tracking-wider text-blue-200">
                KẾT QUẢ ĐIỂM SỐ
              </div>
              <div className="text-5xl sm:text-6xl font-black text-[#FF8A00] my-2">
                {submittedAttempt.score}
                <span className="text-2xl text-white font-bold"> / 10</span>
              </div>
              <p className="text-sm text-blue-100 font-medium">
                {isHigh ? 'Xuất sắc! Bạn đã nắm rất vững kiến thức bài kiểm tra.' : 'Đã ghi nhận bài thi. Hãy xem lại các câu chưa chính xác bên dưới.'}
              </p>
              <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-semibold">
                <span className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/30">
                  Đúng: {submittedAttempt.correctCount} câu
                </span>
                <span className="bg-rose-500/20 text-rose-200 px-3 py-1 rounded-full border border-rose-400/30">
                  Chưa đúng / Khuyết: {submittedAttempt.wrongCount} câu
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Question Review if allowed */}
          {exam.showAnswersAfterSubmit ? (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#FF8A00]" />
                  <span>CHI TIẾT ĐÁP ÁN VÀ LỜI GIẢI</span>
                </h2>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Giáo viên cho phép xem đáp án
                </span>
              </div>

              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const sAns = submittedAttempt.answers[q.id];
                  const isCorrect = !!sAns?.isCorrect;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border ${
                        isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-600 uppercase">
                            {q.type === 'MULTIPLE_CHOICE'
                              ? 'Trắc nghiệm 4 lựa chọn'
                              : q.type === 'TRUE_FALSE'
                              ? 'Trắc nghiệm Đúng/Sai'
                              : 'Trả lời ngắn'}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCorrect ? 'Đạt điểm' : 'Chưa đúng'} ({sAns?.scoreAwarded || 0}/{q.points}đ)
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-800 mb-3 whitespace-pre-wrap">
                        {q.content}
                      </div>

                      {/* Display MC details */}
                      {q.type === 'MULTIPLE_CHOICE' && q.options && (
                        <div className="space-y-2 text-xs sm:text-sm">
                          {q.options.map((opt) => {
                            const isChosen = sAns?.selectedOption === opt.key;
                            const isAnswerKey = q.correctAnswer === opt.key;

                            let optStyle = 'border-slate-200 bg-white text-slate-700';
                            if (isAnswerKey) {
                              optStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                            } else if (isChosen && !isAnswerKey) {
                              optStyle = 'border-rose-400 bg-rose-100 text-rose-900 font-semibold';
                            }

                            return (
                              <div
                                key={opt.key}
                                className={`p-3 rounded-xl border flex items-center justify-between ${optStyle}`}
                              >
                                <span>
                                  <span className="font-extrabold mr-2">{opt.key}.</span>
                                  {opt.content}
                                </span>
                                <div className="flex items-center space-x-2 text-xs font-bold">
                                  {isChosen && (
                                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[11px]">
                                      Bạn chọn
                                    </span>
                                  )}
                                  {isAnswerKey && (
                                    <span className="bg-emerald-700 text-white px-2 py-0.5 rounded text-[11px] flex items-center space-x-1">
                                      <Check className="w-3 h-3" />
                                      <span>Đáp án đúng</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Display True/False details */}
                      {q.type === 'TRUE_FALSE' && q.tfStatements && (
                        <div className="space-y-2 text-xs sm:text-sm">
                          {q.tfStatements.map((stmt) => {
                            const studentVal = sAns?.tfSelections?.[stmt.key];
                            const isStmtCorrect = studentVal === stmt.isCorrect;

                            return (
                              <div
                                key={stmt.key}
                                className={`p-3 rounded-xl border flex items-center justify-between ${
                                  isStmtCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-rose-50 border-rose-200 text-rose-900'
                                }`}
                              >
                                <div>
                                  <span className="font-bold mr-2">{stmt.key})</span>
                                  <span>{stmt.content}</span>
                                </div>
                                <div className="text-right text-xs font-bold space-x-2 flex-shrink-0">
                                  <span>
                                    Bạn chọn:{' '}
                                    <span className="underline">
                                      {typeof studentVal === 'boolean'
                                        ? studentVal
                                          ? 'Đúng'
                                          : 'Sai'
                                        : 'Chưa chọn'}
                                    </span>
                                  </span>
                                  <span className="text-emerald-700">
                                    [Đáp án: {stmt.isCorrect ? 'Đúng' : 'Sai'}]
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Display Short Answer details */}
                      {q.type === 'SHORT_ANSWER' && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1">
                          <div>
                            <span className="font-bold text-slate-700">Đáp án bạn nhập:</span>{' '}
                            <span className="font-mono font-bold text-slate-900">
                              {sAns?.shortAnswerText || '(Chưa điền)'}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-emerald-700">Đáp án chính xác:</span>{' '}
                            <span className="font-mono font-black text-emerald-700">
                              {q.correctAnswer}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                          <span className="font-bold">Lời giải chi tiết:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <span>Giáo viên cài đặt không hiển thị đáp án chi tiết sau khi nộp bài.</span>
            </div>
          )}

          {/* Footer Back Button */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={onExit}
              className="py-3 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay về danh sách bài kiểm tra</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE EXAM TAKING INTERFACE
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Network Alert Banners as requested */}
      {!isOnline && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 animate-pulse sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Mất kết nối. Hệ thống đang cố gắng kết nối lại...</span>
        </div>
      )}
      {showSyncSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 sticky top-0 z-50">
          <Wifi className="w-4 h-4" />
          <span>Tất cả dữ liệu đã được đồng bộ.</span>
        </div>
      )}

      {/* Exam Room Header as required */}
      <header className="bg-[#0D47A1] text-white shadow-md border-b-2 border-[#FF8A00] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Test name, student name, class */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase bg-white/10 px-2 py-0.5 rounded text-blue-200">
                Phòng thi trực tuyến
              </span>
              <span className="text-xs font-semibold text-[#FF8A00]">
                Môn {exam.subject}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white mt-0.5 line-clamp-1">
              {exam.title}
            </h1>
            <div className="text-xs text-blue-100 font-medium mt-0.5">
              Học sinh: <span className="font-bold text-white">{currentUser?.fullName}</span> • Lớp:{' '}
              <span className="font-black text-[#FF8A00]">{currentUser?.className || '12A1'}</span>
            </div>
          </div>

          {/* Right: Live Real-time Countdown Timer as required */}
          <div className="flex items-center space-x-4 self-end md:self-auto">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-black text-base sm:text-lg shadow-inner ${
                secondsRemaining < 300
                  ? 'bg-red-500 text-white border-red-300 animate-pulse'
                  : 'bg-white text-[#0D47A1] border-blue-200'
              }`}
            >
              <Clock
                className={`w-5 h-5 ${secondsRemaining < 300 ? 'text-white' : 'text-[#FF8A00]'}`}
              />
              <span>THỜI GIAN CÒN LẠI: {formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="py-2.5 px-5 rounded-xl bg-[#FF8A00] hover:bg-orange-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>NỘP BÀI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Body */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left/Center: Question Presentation (Takes 3 columns on large screens) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div>
            {/* Question Header & Flag Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-black text-white bg-[#0D47A1] px-3 py-1 rounded-lg">
                  CÂU {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {currentQ.type === 'MULTIPLE_CHOICE'
                    ? 'Phần I: Trắc nghiệm 4 lựa chọn'
                    : currentQ.type === 'TRUE_FALSE'
                    ? 'Phần II: Trắc nghiệm Đúng / Sai'
                    : 'Phần III: Câu hỏi trả lời ngắn'}
                </span>
                <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-2 py-0.5 rounded">
                  {currentQ.points} điểm
                </span>
              </div>

              {/* [ĐÁNH DẤU XEM LẠI] button as required */}
              <button
                type="button"
                onClick={handleToggleFlag}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isFlagged
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Flag className={`w-4 h-4 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{isFlagged ? 'ĐÃ ĐÁNH DẤU XEM LẠI' : 'ĐÁNH DẤU XEM LẠI'}</span>
              </button>
            </div>

            {/* Question Content */}
            <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed mb-6 whitespace-pre-wrap">
              {currentQ.content}
            </div>

            {/* Formats according to Question Type */}
            {/* 1. Trắc nghiệm 1 đáp án đúng (A, B, C, D) */}
            {currentQ.type === 'MULTIPLE_CHOICE' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = currentAnswer?.selectedOption === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectMC(opt.key)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center space-x-3 cursor-pointer ${
                        isSelected
                          ? 'border-[#0D47A1] bg-blue-50/70 text-[#0D47A1] shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#0D47A1] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm sm:text-base font-medium flex-1">
                        {opt.content}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Trắc nghiệm Đúng/Sai: 4 nhận định a, b, c, d */}
            {currentQ.type === 'TRUE_FALSE' && currentQ.tfStatements && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Học sinh đánh dấu Đúng (Đ) hoặc Sai (S) cho từng nhận định sau:
                </div>
                {currentQ.tfStatements.map((stmt) => {
                  const currentVal = currentAnswer?.tfSelections?.[stmt.key];

                  return (
                    <div
                      key={stmt.key}
                      className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="text-sm font-medium text-slate-800 flex-1">
                        <span className="font-extrabold text-[#0D47A1] mr-2">{stmt.key})</span>
                        {stmt.content}
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectTF(stmt.key, true)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1 transition-all ${
                            currentVal === true
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Đúng (Đ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectTF(stmt.key, false)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1 transition-all ${
                            currentVal === false
                              ? 'bg-rose-600 text-white shadow'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-rose-50'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Sai (S)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Câu hỏi trả lời ngắn: nhập số hoặc từ */}
            {currentQ.type === 'SHORT_ANSWER' && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">
                  Nhập câu trả lời ngắn của bạn:
                </label>
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={currentAnswer?.shortAnswerText || ''}
                    onChange={(e) => handleShortAnswerChange(e.target.value)}
                    placeholder="Điền đáp án (ví dụ: 100, 4, a, b...)"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1] font-bold text-slate-900 text-base"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  * Nhập số hoặc kết quả rút gọn theo yêu cầu đề bài.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Controls as required */}
          <div className="pt-6 mt-8 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-1 transition-colors ${
                currentIndex === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>CÂU TRƯỚC</span>
            </button>

            <div className="text-xs text-slate-500 font-semibold hidden sm:block">
              Tự động lưu bài làm liên tục • Không lo mất kết nối
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm flex items-center space-x-1 transition-colors"
              >
                <span>CÂU TIẾP THEO</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="py-2.5 px-5 rounded-xl bg-[#FF8A00] hover:bg-orange-600 text-white font-black text-xs sm:text-sm flex items-center space-x-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>NỘP BÀI THI</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar: Bảng số câu (Question Palette) as required */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-extrabold text-slate-800">DANH SÁCH CÂU HỎI</h2>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {answeredCount}/{questions.length} câu
              </span>
            </div>

            {/* Color Legend as explicitly specified in prompt:
                - Chưa trả lời: màu xám
                - Đã trả lời: màu xanh (#0D47A1)
                - Câu đang xem: màu cam (#FF8A00)
                - Đánh dấu xem lại: màu vàng
            */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 mb-4 p-2 bg-slate-50 rounded-xl">
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300"></span>
                <span>Chưa trả lời</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#0D47A1]"></span>
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-400"></span>
                <span>Xem lại</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#FF8A00]"></span>
                <span>Đang xem</span>
              </div>
            </div>

            {/* Question numbers grid */}
            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const answered = isQuestionAnswered(q);
                const flagged = !!answers[q.id]?.isFlagged;

                let btnColor = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'; // Chưa trả lời: màu xám
                if (flagged) {
                  btnColor = 'bg-amber-400 text-amber-950 border-amber-500 font-bold'; // Đánh dấu xem lại: màu vàng
                } else if (answered) {
                  btnColor = 'bg-[#0D47A1] text-white border-[#0D47A1] font-bold'; // Đã trả lời: màu xanh
                }

                // Câu đang xem: màu cam highlight
                const viewingStyle = isCurrent
                  ? 'ring-3 ring-[#FF8A00] ring-offset-2 scale-105 z-10 font-black'
                  : '';

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs flex items-center justify-center border transition-all cursor-pointer relative ${btnColor} ${viewingStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {flagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action at bottom of palette */}
          <div className="pt-4 mt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-sm shadow transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4 text-[#FF8A00]" />
              <span>NỘP BÀI THI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal as requested:
          "Bạn có chắc chắn muốn nộp bài không?"
          - Đã trả lời: XX/XX câu
          - Chưa trả lời: XX câu
          - [QUAY LẠI]
          - [NỘP BÀI]
      */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-[#FF8A00] flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">
                Bạn có chắc chắn muốn nộp bài không?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sau khi nộp bài, bạn không thể chỉnh sửa đáp án đã chọn.
              </p>
            </div>

            {/* Answer Status Statistics */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mb-6 text-sm">
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>Đã trả lời:</span>
                <span className="text-base">{answeredCount} / {questions.length} câu</span>
              </div>
              <div className="flex items-center justify-between text-rose-600 font-bold">
                <span>Chưa trả lời:</span>
                <span className="text-base">{unansweredCount} câu</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-xs pt-1 border-t border-slate-200">
                <span>Thời gian còn lại:</span>
                <span className="font-bold text-slate-800">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            {/* Action Buttons as requested */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
              >
                QUAY LẠI
              </button>
              <button
                type="button"
                onClick={doSubmit}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>XÁC NHẬN NỘP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
