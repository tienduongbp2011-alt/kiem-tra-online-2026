import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamAttempt, Question } from '../../types';
import { exportExamResultsToExcel } from '../../utils/excelUtils';
import {
  BarChart3,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  X,
  FileSpreadsheet,
  Award,
} from 'lucide-react';

interface ExamResultsViewProps {
  initialExamId?: string;
}

export const ExamResultsView: React.FC<ExamResultsViewProps> = ({ initialExamId }) => {
  const { exams, attempts, questions: allQuestions } = useApp();

  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'SCORE_ASC' | 'CLASS' | 'NAME'>('SCORE_DESC');

  // Inspected student submission modal
  const [inspectAttempt, setInspectAttempt] = useState<ExamAttempt | null>(null);

  const currentExam = exams.find((e) => e.id === selectedExamId);

  // Attempts for this exam
  const examAttempts = attempts.filter(
    (a) => a.examId === selectedExamId && a.isSubmitted
  );

  // Filter & Search
  let processedAttempts = examAttempts.filter((a) => {
    return (
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.className.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sorting as required:
  // - Điểm cao -> thấp
  // - Điểm thấp -> cao
  // - Theo lớp
  // - Theo tên
  processedAttempts.sort((a, b) => {
    if (sortBy === 'SCORE_DESC') return b.score - a.score;
    if (sortBy === 'SCORE_ASC') return a.score - b.score;
    if (sortBy === 'CLASS') return a.className.localeCompare(b.className);
    if (sortBy === 'NAME') return a.studentName.localeCompare(b.studentName);
    return 0;
  });

  // Statistics
  const totalSubmissions = examAttempts.length;
  const avgScore =
    totalSubmissions > 0
      ? (examAttempts.reduce((acc, c) => acc + c.score, 0) / totalSubmissions).toFixed(2)
      : '0.00';
  const highestScore =
    totalSubmissions > 0 ? Math.max(...examAttempts.map((a) => a.score)) : 0;
  const lowestScore =
    totalSubmissions > 0 ? Math.min(...examAttempts.map((a) => a.score)) : 0;

  // Export Excel handler as requested
  const handleExportExcel = () => {
    if (!currentExam) return;
    exportExamResultsToExcel(processedAttempts, currentExam.title);
  };

  return (
    <div className="space-y-6">
      {/* Header and Exam Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            KẾT QUẢ VÀ CHI TIẾT BÀI LÀM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi điểm số, xếp hạng, thời gian làm bài và xuất file bảng điểm Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-[#0D47A1]"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.subject})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportExcel}
            disabled={processedAttempts.length === 0}
            className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>XUẤT EXCEL</span>
          </button>
        </div>
      </div>

      {/* Summary Score Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-bold block mb-1">Số bài đã nộp</span>
          <span className="text-2xl font-black text-[#0D47A1]">{totalSubmissions}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Học sinh hoàn thành</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-bold block mb-1">Điểm trung bình</span>
          <span className="text-2xl font-black text-[#FF8A00]">{avgScore}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Thang điểm 10</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-bold block mb-1">Điểm cao nhất</span>
          <span className="text-2xl font-black text-emerald-600">{highestScore}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Thủ khoa bài thi</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-bold block mb-1">Điểm thấp nhất</span>
          <span className="text-2xl font-black text-rose-600">{lowestScore}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Cần phụ đạo</span>
        </div>
      </div>

      {/* Filter and Sorting Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh, mã HS, lớp..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        {/* Sắp xếp: Điểm cao -> thấp, Điểm thấp -> cao, Theo lớp, Theo tên as required */}
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 w-full md:w-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span>Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
          >
            <option value="SCORE_DESC">Điểm cao &rarr; thấp</option>
            <option value="SCORE_ASC">Điểm thấp &rarr; cao</option>
            <option value="CLASS">Theo lớp</option>
            <option value="NAME">Theo tên học sinh</option>
          </select>
        </div>
      </div>

      {/* Results Table as required:
          STT | Mã học sinh | Họ và tên | Lớp | Điểm | Số câu đúng | Số câu sai | Thời gian làm bài | Thời điểm nộp bài
      */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">STT</th>
                <th className="py-3.5 px-3">Mã học sinh</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-3">Lớp</th>
                <th className="py-3.5 px-3 text-center">Điểm số</th>
                <th className="py-3.5 px-3 text-center">Số câu đúng</th>
                <th className="py-3.5 px-3 text-center">Số câu sai</th>
                <th className="py-3.5 px-3 text-center">Thời gian làm bài</th>
                <th className="py-3.5 px-4 text-center">Thời điểm nộp</th>
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {processedAttempts.map((att, idx) => {
                const min = Math.floor((att.timeSpentSeconds || 0) / 60);
                const sec = (att.timeSpentSeconds || 0) % 60;
                const timeFormatted = `${min}p ${sec.toString().padStart(2, '0')}s`;

                return (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#0D47A1]">
                      {att.studentCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{att.studentName}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0D47A1] font-bold text-xs">
                        {att.className}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-base font-black text-emerald-600">
                        {att.score}
                      </span>
                      <span className="text-xs text-slate-400">/{att.maxScore}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                      {att.correctCount} câu
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-rose-600">
                      {att.wrongCount} câu
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-700 font-semibold">
                      {timeFormatted}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 text-xs">
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectAttempt(att)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0D47A1] hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem bài làm</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: XEM CHI TIẾT BÀI LÀM CỦA TỪNG HỌC SINH             */}
      {/* ========================================================= */}
      {inspectAttempt && currentExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  CHI TIẾT BÀI THI CỦA HỌC SINH
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Học sinh: <span className="font-bold text-slate-800">{inspectAttempt.studentName}</span> ({inspectAttempt.studentCode}) • Lớp: <span className="font-bold text-[#0D47A1]">{inspectAttempt.className}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectAttempt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score header */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Điểm bài thi:</span>
                <span className="text-3xl font-black text-[#0D47A1]">
                  {inspectAttempt.score} <span className="text-base text-slate-400">/ 10</span>
                </span>
              </div>
              <div className="text-right text-xs space-y-1">
                <div className="text-emerald-700 font-bold">Số câu đúng: {inspectAttempt.correctCount}</div>
                <div className="text-rose-600 font-bold">Số câu chưa đúng: {inspectAttempt.wrongCount}</div>
              </div>
            </div>

            {/* Detailed questions review */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
              {(currentExam.questions || allQuestions.filter((q) => currentExam.questionIds.includes(q.id))).map((q, idx) => {
                const sAns = inspectAttempt.answers[q.id];
                const isCorrect = !!sAns?.isCorrect;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border ${
                      isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        Câu {idx + 1} ({q.points} điểm)
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCorrect ? 'Đúng' : 'Chưa đúng'} ({sAns?.scoreAwarded || 0}/{q.points}đ)
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                      {q.content}
                    </div>

                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-bold text-slate-600">Học sinh chọn:</span>{' '}
                          <span className="font-extrabold text-[#0D47A1]">
                            {sAns?.selectedOption || '(Chưa chọn)'}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-emerald-700">Đáp án chính xác:</span>{' '}
                          <span className="font-extrabold text-emerald-700">{q.correctAnswer}</span>
                        </div>
                      </div>
                    )}

                    {q.type === 'TRUE_FALSE' && (
                      <div className="text-xs space-y-1">
                        {q.tfStatements?.map((stmt) => (
                          <div key={stmt.key} className="flex justify-between">
                            <span>{stmt.key}) {stmt.content}</span>
                            <span className="font-bold">
                              HS chọn:{' '}
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
                          <span className="font-bold text-slate-600">Học sinh nhập:</span>{' '}
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
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectAttempt(null)}
                className="py-2.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
