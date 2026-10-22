import React from 'react';
import { Exam, ExamAttempt, Question } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle, Clock, Calendar, Check, X, ArrowLeft, Sparkles, HelpCircle } from 'lucide-react';

interface StudentResultModalProps {
  attempt: ExamAttempt;
  exam: Exam;
  onClose: () => void;
}

export const StudentResultModal: React.FC<StudentResultModalProps> = ({
  attempt,
  exam,
  onClose,
}) => {
  const { questions: allQuestions } = useApp();

  const questions: Question[] = exam.questions || allQuestions.filter((q) => exam.questionIds.includes(q.id));
  const min = Math.floor((attempt.timeSpentSeconds || 0) / 60);
  const sec = (attempt.timeSpentSeconds || 0) % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-800">KẾT QUẢ BÀI KIỂM TRA</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Bài thi: <span className="font-bold text-[#0D47A1]">{attempt.examTitle}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score banner */}
        <div className="bg-gradient-to-r from-[#0D47A1] to-blue-800 text-white rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider block">
              Điểm số của bạn
            </span>
            <div className="text-4xl sm:text-5xl font-black text-[#FF8A00] my-1">
              {attempt.score} <span className="text-xl text-white font-bold">/ 10</span>
            </div>
            <div className="text-xs text-blue-200">
              Thời gian làm bài: {min} phút {sec.toString().padStart(2, '0')} giây
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 text-xs font-bold">
            <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3 py-1.5 rounded-xl">
              Đúng: {attempt.correctCount} câu
            </span>
            <span className="bg-rose-500/20 text-rose-200 border border-rose-400/30 px-3 py-1.5 rounded-xl">
              Sai: {attempt.wrongCount} câu
            </span>
          </div>
        </div>

        {/* Question review list if allowed */}
        {exam.showAnswersAfterSubmit ? (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const sAns = attempt.answers[q.id];
              const isCorrect = !!sAns?.isCorrect;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Câu {idx + 1} ({q.points}đ)
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? 'Đúng' : 'Chưa đúng'} ({sAns?.scoreAwarded || 0}/{q.points}đ)
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 whitespace-pre-wrap">
                    {q.content}
                  </div>

                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-bold text-slate-600">Bạn đã chọn:</span>{' '}
                        <span className="font-black text-[#0D47A1]">
                          {sAns?.selectedOption || '(Chưa chọn)'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-700">Đáp án chính xác:</span>{' '}
                        <span className="font-black text-emerald-700">{q.correctAnswer}</span>
                      </div>
                    </div>
                  )}

                  {q.type === 'TRUE_FALSE' && (
                    <div className="text-xs space-y-1">
                      {q.tfStatements?.map((stmt) => (
                        <div key={stmt.key} className="flex justify-between">
                          <span>{stmt.key}) {stmt.content}</span>
                          <span className="font-bold">
                            Bạn chọn:{' '}
                            {typeof sAns?.tfSelections?.[stmt.key] === 'boolean'
                              ? sAns.tfSelections[stmt.key]
                                ? 'Đúng'
                                : 'Sai'
                              : 'Chưa chọn'}{' '}
                            [ĐA: {stmt.isCorrect ? 'Đúng' : 'Sai'}]
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'SHORT_ANSWER' && (
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-bold text-slate-600">Bạn đã nhập:</span>{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {sAns?.shortAnswerText || '(Chưa điền)'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-700">Đáp án chuẩn:</span>{' '}
                        <span className="font-mono font-bold text-emerald-700">{q.correctAnswer}</span>
                      </div>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                      <span className="font-bold">Lời giải:</span> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <span>Giáo viên cài đặt không hiển thị đáp án chi tiết sau khi nộp bài.</span>
          </div>
        )}

        <div className="pt-4 mt-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
