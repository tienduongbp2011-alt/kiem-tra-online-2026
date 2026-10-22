import React from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, RefreshCw, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { resetToSampleData } = useApp();
  const [resetDone, setResetDone] = React.useState(false);

  const handleReset = () => {
    if (
      confirm(
        'Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu mẫu ban đầu (bao gồm tài khoản, đề thi, ngân hàng câu hỏi, kết quả học sinh)?'
      )
    ) {
      resetToSampleData();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          CÀI ĐẶT HỆ THỐNG
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cấu hình chung hệ thống kiểm tra trắc nghiệm trực tuyến năm học 2026–2027
        </p>
      </div>

      {resetDone && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Đã khôi phục dữ liệu mẫu thành công!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#0D47A1]" />
            <span>Thông tin Bản quyền và Cấu hình Đơn vị</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold block">Đơn vị trường học:</span>
              <span className="font-extrabold text-[#0D47A1]">Trường THPT Thanh Hòa</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold block">Hệ thống:</span>
              <span className="font-extrabold text-slate-800">KIỂM TRA ONLINE - THPT</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold block">Năm học áp dụng:</span>
              <span className="font-extrabold text-slate-800">2026–2027</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold block">Màu sắc nhận diện:</span>
              <span className="font-bold text-slate-700">
                Xanh dương #0D47A1 • Trắng #FFFFFF • Điểm nhấn Cam #FF8A00
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold block">Chuẩn ma trận đề:</span>
              <span className="font-bold text-emerald-700">
                Bộ Giáo dục và Đào tạo (40% NB - 30% TH - 20% VD - 10% VDC)
              </span>
            </div>
          </div>
        </div>

        {/* Khôi phục dữ liệu */}
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-800 mb-2 flex items-center space-x-2">
            <Database className="w-4 h-4 text-rose-600" />
            <span>Khôi phục dữ liệu mẫu ban đầu</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Nếu bạn đã xóa hoặc muốn nạp lại bộ dữ liệu đề thi, học sinh, câu hỏi 3 phần chuẩn của THPT 2026–2027.
          </p>

          <button
            onClick={handleReset}
            className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ĐẶT LẠI DỮ LIỆU MẪU BAN ĐẦU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
