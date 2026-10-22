import React from 'react';
import { useApp } from '../../context/AppContext';
import { TeacherView } from './TeacherLayout';
import {
  Users,
  FileCheck,
  DoorOpen,
  DoorClosed,
  CheckCircle,
  TrendingUp,
  PlusCircle,
  Play,
  Pause,
  Copy,
  Trash2,
  Eye,
  BarChart2,
  Database,
  ArrowUpRight,
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (view: TeacherView) => void;
  onOpenCreateExam: () => void;
  onSelectExamForResults: (examId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigate,
  onOpenCreateExam,
  onSelectExamForResults,
}) => {
  const { users, exams, attempts, toggleExamStatus, duplicateExam, deleteExam } = useApp();

  // Metrics requested
  const totalStudents = users.filter((u) => u.role === 'STUDENT').length;
  const totalExams = exams.length;
  const openExamsCount = exams.filter((e) => e.status === 'OPEN').length;
  const closedExamsCount = exams.filter((e) => e.status === 'CLOSED').length;
  const totalAttemptsCount = attempts.filter((a) => a.isSubmitted).length;

  const submittedAttempts = attempts.filter((a) => a.isSubmitted);
  const avgScore =
    submittedAttempts.length > 0
      ? (
          submittedAttempts.reduce((acc, curr) => acc + curr.score, 0) /
          submittedAttempts.length
        ).toFixed(2)
      : '0.00';

  // Score distribution calculation
  const scoreRanges = {
    gioi: submittedAttempts.filter((a) => a.score >= 8.0).length,
    kha: submittedAttempts.filter((a) => a.score >= 6.5 && a.score < 8.0).length,
    tb: submittedAttempts.filter((a) => a.score >= 5.0 && a.score < 6.5).length,
    yeu: submittedAttempts.filter((a) => a.score < 5.0).length,
  };

  const metricCards = [
    {
      title: 'Tổng số học sinh',
      value: totalStudents,
      sub: 'Trên toàn trường',
      icon: Users,
      color: 'text-[#0D47A1]',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Tổng số bài kiểm tra',
      value: totalExams,
      sub: 'Đã thiết lập',
      icon: FileCheck,
      color: 'text-[#FF8A00]',
      bg: 'bg-orange-50 border-orange-200',
    },
    {
      title: 'Số bài đang mở',
      value: openExamsCount,
      sub: 'Học sinh đang thi',
      icon: DoorOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Số bài đã kết thúc',
      value: closedExamsCount,
      sub: 'Đã khóa bài thi',
      icon: DoorClosed,
      color: 'text-slate-600',
      bg: 'bg-slate-50 border-slate-200',
    },
    {
      title: 'Số lượt làm bài',
      value: totalAttemptsCount,
      sub: 'Bài đã nộp thành công',
      icon: CheckCircle,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Điểm trung bình',
      value: `${avgScore}/10`,
      sub: 'Thang điểm 10',
      icon: TrendingUp,
      color: 'text-[#0D47A1]',
      bg: 'bg-blue-50 border-blue-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            TỔNG QUAN QUẢN TRỊ KIỂM TRA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tiến độ kiểm tra, tỷ lệ hoàn thành và phổ điểm của các lớp THPT
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('QUESTIONS')}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 text-[#0D47A1]" />
            <span>Ngân hàng câu hỏi</span>
          </button>
          <button
            onClick={onOpenCreateExam}
            className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#FF8A00]" />
            <span>TẠO BÀI KIỂM TRA</span>
          </button>
        </div>
      </div>

      {/* 6 Metrics Grid as required */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {metricCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-2xl border ${c.bg} flex items-center justify-between shadow-xs`}
            >
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">{c.title}</span>
                <span className={`text-2xl sm:text-3xl font-black ${c.color}`}>{c.value}</span>
                <span className="text-[11px] text-slate-500 font-medium block mt-1">{c.sub}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center">
                <Icon className={`w-6 h-6 ${c.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Distribution Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
          <h2 className="text-base font-extrabold text-slate-800 mb-2 flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-[#0D47A1]" />
            <span>Phổ điểm học sinh</span>
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Dựa trên {totalAttemptsCount} lượt làm bài đã hoàn thành
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700">Giỏi (8.0 - 10.0 điểm)</span>
                <span>{scoreRanges.gioi} học sinh</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${totalAttemptsCount ? (scoreRanges.gioi / totalAttemptsCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-700">Khá (6.5 - 7.9 điểm)</span>
                <span>{scoreRanges.kha} học sinh</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${totalAttemptsCount ? (scoreRanges.kha / totalAttemptsCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-700">Trung bình (5.0 - 6.4 điểm)</span>
                <span>{scoreRanges.tb} học sinh</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${totalAttemptsCount ? (scoreRanges.tb / totalAttemptsCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-700">Dưới trung bình (&lt; 5.0)</span>
                <span>{scoreRanges.yeu} học sinh</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${totalAttemptsCount ? (scoreRanges.yeu / totalAttemptsCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('STATISTICS')}
              className="w-full py-2 px-3 text-xs font-bold text-[#0D47A1] hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <span>Xem báo cáo thống kê chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Exams & Quick Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                CÁC BÀI KIỂM TRA HIỆN HÀNH
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản trị nhanh trạng thái Mở/Đóng đề thi và xem kết quả
              </p>
            </div>
            <button
              onClick={() => onNavigate('EXAMS')}
              className="text-xs font-bold text-[#0D47A1] hover:underline"
            >
              Xem tất cả ({exams.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {exams.slice(0, 5).map((exam) => {
              const attemptCount = attempts.filter(
                (a) => a.examId === exam.id && a.isSubmitted
              ).length;

              return (
                <div
                  key={exam.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-xl px-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0D47A1]">
                        {exam.subject} • Khối {exam.grade}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                          exam.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {exam.status === 'OPEN' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-800">{exam.title}</div>
                    <div className="text-xs text-slate-500">
                      Giao cho: <span className="font-semibold text-slate-700">{exam.classIds.join(', ')}</span> • {exam.durationMinutes} phút • {attemptCount} lượt đã nộp
                    </div>
                  </div>

                  {/* Actions as requested: Mở/Đóng, Sao chép, Xem kết quả */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => toggleExamStatus(exam.id)}
                      title={exam.status === 'OPEN' ? 'Đóng bài kiểm tra' : 'Mở bài kiểm tra'}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors ${
                        exam.status === 'OPEN'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {exam.status === 'OPEN' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{exam.status === 'OPEN' ? 'Đóng bài' : 'Mở bài'}</span>
                    </button>

                    <button
                      onClick={() => duplicateExam(exam.id)}
                      title="Sao chép đề kiểm tra"
                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectExamForResults(exam.id)}
                      title="Xem kết quả bài kiểm tra"
                      className="py-1.5 px-3 rounded-lg bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-xs flex items-center space-x-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Kết quả</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa bài "${exam.title}"?`)) {
                          deleteExam(exam.id);
                        }
                      }}
                      title="Xóa bài kiểm tra"
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
