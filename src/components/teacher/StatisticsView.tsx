import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, Users, Award, CheckCircle2, BookOpen } from 'lucide-react';

export const StatisticsView: React.FC = () => {
  const { exams, attempts, classes, questions } = useApp();

  const submittedAttempts = attempts.filter((a) => a.isSubmitted);

  // Group by grade ranges
  const range9_10 = submittedAttempts.filter((a) => a.score >= 9.0).length;
  const range8_89 = submittedAttempts.filter((a) => a.score >= 8.0 && a.score < 9.0).length;
  const range65_79 = submittedAttempts.filter((a) => a.score >= 6.5 && a.score < 8.0).length;
  const range5_64 = submittedAttempts.filter((a) => a.score >= 5.0 && a.score < 6.5).length;
  const rangeBelow5 = submittedAttempts.filter((a) => a.score < 5.0).length;

  const total = submittedAttempts.length || 1;

  // Question bank statistics
  const mcCount = questions.filter((q) => q.type === 'MULTIPLE_CHOICE').length;
  const tfCount = questions.filter((q) => q.type === 'TRUE_FALSE').length;
  const saCount = questions.filter((q) => q.type === 'SHORT_ANSWER').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          THỐNG KÊ VÀ PHÂN TÍCH CHẤT LƯỢNG
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Báo cáo phổ điểm, tỷ lệ đạt chuẩn và số liệu ngân hàng đề thi THPT 2026–2027
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phổ điểm chi tiết */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#0D47A1]" />
            <span>Phổ điểm toàn trường</span>
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700">9.0 - 10.0 (Xuất sắc)</span>
                <span>{range9_10} học sinh ({Math.round((range9_10 / total) * 100)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${(range9_10 / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-700">8.0 - 8.9 (Giỏi)</span>
                <span>{range8_89} học sinh ({Math.round((range8_89 / total) * 100)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(range8_89 / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-indigo-700">6.5 - 7.9 (Khá)</span>
                <span>{range65_79} học sinh ({Math.round((range65_79 / total) * 100)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(range65_79 / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-700">5.0 - 6.4 (Trung bình)</span>
                <span>{range5_64} học sinh ({Math.round((range5_64 / total) * 100)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(range5_64 / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-700">Dưới 5.0 (Chưa đạt)</span>
                <span>{rangeBelow5} học sinh ({Math.round((rangeBelow5 / total) * 100)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${(rangeBelow5 / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê ngân hàng câu hỏi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#FF8A00]" />
            <span>Thống kê Ngân hàng đề thi</span>
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-[#0D47A1] block">Phần I (MC)</span>
              <span className="text-2xl font-black text-slate-800">{mcCount}</span>
              <span className="text-[10px] text-slate-500 block">4 lựa chọn</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 block">Phần II (Đ/S)</span>
              <span className="text-2xl font-black text-slate-800">{tfCount}</span>
              <span className="text-[10px] text-slate-500 block">4 ý a-b-c-d</span>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <span className="text-xs font-bold text-[#FF8A00] block">Phần III (Ngắn)</span>
              <span className="text-2xl font-black text-slate-800">{saCount}</span>
              <span className="text-[10px] text-slate-500 block">Trả lời ngắn</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span>Tổng số câu hỏi trong kho:</span>
              <span className="font-bold text-slate-800">{questions.length} câu</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng số đề thi đã tạo:</span>
              <span className="font-bold text-slate-800">{exams.length} đề</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng số lớp học:</span>
              <span className="font-bold text-slate-800">{classes.length} lớp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
