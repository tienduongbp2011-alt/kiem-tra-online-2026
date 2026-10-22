import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam, ExamAttempt } from '../../types';
import {
  Clock,
  HelpCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Award,
  BookOpen,
  Eye,
  Filter,
} from 'lucide-react';

interface StudentDashboardProps {
  onStartExam: (exam: Exam) => void;
  onViewResult: (attempt: ExamAttempt, exam: Exam) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartExam, onViewResult }) => {
  const { currentUser, exams, attempts } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  if (!currentUser) return null;

  const studentClass = currentUser.className || '12A1';

  // Filter exams assigned to this student:
  // An exam is assigned if its classIds contains studentClass or 'ALL' or student's grade
  const assignedExams = exams.filter((exam) => {
    if (exam.status === 'DRAFT') return false;
    const isClassMatch =
      exam.classIds.includes(studentClass) ||
      exam.classIds.includes('ALL') ||
      exam.classIds.includes(`ALL_GRADE_${currentUser.className?.slice(0, 2)}`);
    return isClassMatch;
  });

  // Determine state of each exam for this student
  const getExamStudentStatus = (exam: Exam): {
    status: 'CHƯA LÀM' | 'ĐANG LÀM' | 'ĐÃ HOÀN THÀNH' | 'HẾT HẠN';
    attempt?: ExamAttempt;
    canTake: boolean;
  } => {
    const studentAttempts = attempts.filter(
      (a) => a.examId === exam.id && a.studentId === currentUser.id
    );
    const submittedAttempt = studentAttempts.find((a) => a.isSubmitted);
    const inProgressAttempt = studentAttempts.find((a) => !a.isSubmitted);

    const now = new Date();
    const isExpired = exam.endTime ? new Date(exam.endTime) < now : false;

    if (submittedAttempt) {
      // Check if maxAttempts allows retake
      const totalSubmitted = studentAttempts.filter((a) => a.isSubmitted).length;
      if (exam.maxAttempts > 1 && totalSubmitted < exam.maxAttempts && !isExpired && exam.status === 'OPEN') {
        return { status: 'CHƯA LÀM', attempt: submittedAttempt, canTake: true };
      }
      return { status: 'ĐÃ HOÀN THÀNH', attempt: submittedAttempt, canTake: false };
    }

    if (inProgressAttempt) {
      return { status: 'ĐANG LÀM', attempt: inProgressAttempt, canTake: true };
    }

    if (isExpired || exam.status === 'CLOSED') {
      return { status: 'HẾT HẠN', canTake: false };
    }

    return { status: 'CHƯA LÀM', canTake: exam.status === 'OPEN' };
  };

  const myAttempts = attempts.filter(
    (a) => a.studentId === currentUser.id && a.isSubmitted
  );

  const avgScore =
    myAttempts.length > 0
      ? (
          myAttempts.reduce((acc, curr) => acc + curr.score, 0) / myAttempts.length
        ).toFixed(2)
      : '--';

  // Filter by subject
  const subjects = Array.from(new Set(assignedExams.map((e) => e.subject)));
  const filteredExams = assignedExams.filter(
    (e) => selectedSubject === 'ALL' || e.subject === selectedSubject
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner as required: Xin chào, [HỌ VÀ TÊN] | Lớp: [10A...] */}
      <div className="bg-gradient-to-r from-[#0D47A1] to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-700/60 text-blue-200 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>Học sinh THPT • Năm học 2026–2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Xin chào, {currentUser.fullName}
            </h1>
            <p className="text-base font-bold text-blue-200 mt-1">
              Lớp: <span className="text-[#FF8A00] font-black">{studentClass}</span> • Mã học sinh: <span className="text-white">{currentUser.studentCode || currentUser.username}</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-blue-900/60 p-3 rounded-xl border border-blue-700/60 text-center">
            <div className="px-3">
              <div className="text-xs text-blue-200 font-medium">Đã hoàn thành</div>
              <div className="text-xl font-black text-emerald-400">{myAttempts.length}</div>
            </div>
            <div className="px-3 border-x border-blue-700/60">
              <div className="text-xs text-blue-200 font-medium">Điểm TB</div>
              <div className="text-xl font-black text-[#FF8A00]">{avgScore}</div>
            </div>
            <div className="px-3">
              <div className="text-xs text-blue-200 font-medium">Được giao</div>
              <div className="text-xl font-black text-white">{assignedExams.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#0D47A1]" />
            <span>DANH SÁCH BÀI KIỂM TRA ĐƯỢC GIAO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Các bài kiểm tra định kỳ, khảo sát và đánh giá thường xuyên của lớp {studentClass}
          </p>
        </div>

        {/* Filter by subject */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Lọc môn:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-[#0D47A1]"
          >
            <option value="ALL">Tất cả các môn</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Cards Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Hiện tại chưa có bài kiểm tra nào</h3>
          <p className="text-xs text-slate-500 mt-1">
            Giáo viên bộ môn sẽ thông báo khi có lịch kiểm tra mới cho lớp {studentClass}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const { status, attempt, canTake } = getExamStudentStatus(exam);

            // Badges styling
            const badgeStyles = {
              'CHƯA LÀM': 'bg-slate-100 text-slate-700 border-slate-300',
              'ĐANG LÀM': 'bg-blue-100 text-[#0D47A1] border-blue-300 animate-pulse',
              'ĐÃ HOÀN THÀNH': 'bg-emerald-100 text-emerald-800 border-emerald-300',
              'HẾT HẠN': 'bg-rose-100 text-rose-800 border-rose-300',
            }[status];

            const questionCount = exam.questions?.length || exam.questionIds.length;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top / Subject Banner */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#0D47A1] border border-blue-200">
                      Môn: {exam.subject}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full border ${badgeStyles}`}
                    >
                      {status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800 line-clamp-2 leading-snug">
                    {exam.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    Mã đề: <span className="text-slate-700 font-bold">{exam.examCode}</span>
                  </div>
                </div>

                {/* Exam Metadata Info as requested */}
                <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-[#0D47A1]" />
                      <span>Thời gian làm bài:</span>
                    </span>
                    <span className="font-bold text-slate-800">{exam.durationMinutes} phút</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <HelpCircle className="w-4 h-4 text-[#FF8A00]" />
                      <span>Số câu hỏi:</span>
                    </span>
                    <span className="font-bold text-slate-800">{questionCount} câu</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Thời gian mở:</span>
                    </span>
                    <span className="font-medium text-slate-700">
                      {exam.startTime ? new Date(exam.startTime).toLocaleDateString('vi-VN') : 'Đang mở'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Thời gian đóng:</span>
                    </span>
                    <span className="font-medium text-slate-700">
                      {exam.endTime ? new Date(exam.endTime).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </span>
                  </div>

                  {status === 'ĐÃ HOÀN THÀNH' && attempt && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Điểm số đạt được:</span>
                      <span className="text-base font-black text-emerald-600">
                        {attempt.score} / {attempt.maxScore}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="p-4 bg-white">
                  {canTake ? (
                    <button
                      onClick={() => onStartExam(exam)}
                      className="w-full py-3 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
                    >
                      {status === 'ĐANG LÀM' ? (
                        <>
                          <RotateCcw className="w-4 h-4 text-[#FF8A00]" />
                          <span>TIẾP TỤC LÀM BÀI</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-[#FF8A00]" />
                          <span>BẮT ĐẦU LÀM BÀI</span>
                        </>
                      )}
                    </button>
                  ) : status === 'ĐÃ HOÀN THÀNH' && attempt ? (
                    <button
                      onClick={() => onViewResult(attempt, exam)}
                      className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-[#0D47A1]" />
                      <span>XEM KẾT QUẢ BÀI LÀM</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm border border-slate-200 cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>KHÔNG KHẢ DỤNG</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Tests Summary Table */}
      {myAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>LỊCH SỬ KẾT QUẢ CÁC BÀI ĐÃ NỘP</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Tổng số: {myAttempts.length} bài
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tên bài kiểm tra</th>
                  <th className="py-3 px-4">Môn</th>
                  <th className="py-3 px-4 text-center">Điểm số</th>
                  <th className="py-3 px-4 text-center">Thời gian làm</th>
                  <th className="py-3 px-4 text-center">Thời điểm nộp</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {myAttempts.map((att) => {
                  const exam = exams.find((e) => e.id === att.examId);
                  const min = Math.floor((att.timeSpentSeconds || 0) / 60);
                  const sec = (att.timeSpentSeconds || 0) % 60;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{att.examTitle}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0D47A1] font-bold text-xs">
                          {att.subject}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-black text-emerald-600">
                          {att.score}
                        </span>
                        <span className="text-xs text-slate-400">/{att.maxScore}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {min}p {sec.toString().padStart(2, '0')}s
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 text-xs">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : '--'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {exam && (
                          <button
                            onClick={() => onViewResult(att, exam)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0D47A1] hover:bg-blue-100 font-bold text-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem bài</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
