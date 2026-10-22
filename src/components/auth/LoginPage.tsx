import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GraduationCap, ShieldCheck, UserCheck, Eye, EyeOff, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useApp();
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [username, setUsername] = useState('HS1001');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (tab: 'STUDENT' | 'TEACHER') => {
    setActiveTab(tab);
    setErrorMessage('');
    if (tab === 'STUDENT') {
      setUsername('HS1001');
      setPassword('123456');
    } else {
      setUsername('gv_nguyenvana');
      setPassword('gv123456');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const result = login(username, password);
    setIsSubmitting(false);

    if (result.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setErrorMessage(result.message || 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại.');
    }
  };

  const handleQuickLogin = (u: string, p: string, tab: 'STUDENT' | 'TEACHER') => {
    setActiveTab(tab);
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    const res = login(u, p);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-blue-50/40 flex flex-col justify-between">
      {/* Top Header Banner */}
      <header className="w-full bg-[#0D47A1] text-white py-4 px-6 shadow-md border-b-4 border-[#FF8A00]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-md">
              <GraduationCap className="w-7 h-7 text-[#0D47A1]" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white block">
                KIỂM TRA ONLINE
              </span>
              <span className="text-xs text-blue-200 font-medium">
                TRƯỜNG THPT THANH HÒA • NĂM HỌC 2026–2027
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3 text-sm text-blue-100 font-medium bg-blue-800/60 px-4 py-2 rounded-lg border border-blue-600/50">
            <BookOpen className="w-4 h-4 text-[#FF8A00]" />
            <span>Kỳ thi chính thức & Khảo sát định kỳ</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {/* Main Title Required by Prompt */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D47A1] leading-tight mb-2 tracking-tight">
              XIN CHÀO CÁC BẠN ĐẾN VỚI TRANG KIỂM TRA ONLINE
            </h1>
            <p className="text-base sm:text-lg font-semibold text-slate-600">
              Kiểm tra online – Năm học 2026–2027
            </p>
          </div>

          {/* Toggle Role Buttons as Requested */}
          <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300">
            <button
              type="button"
              onClick={() => handleTabChange('STUDENT')}
              className={`py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'STUDENT'
                  ? 'bg-[#0D47A1] text-white shadow-md'
                  : 'text-slate-700 hover:text-[#0D47A1] hover:bg-white/60'
              }`}
            >
              <UserCheck className="w-5 h-5 text-[#FF8A00]" />
              <span>ĐĂNG NHẬP HỌC SINH</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('TEACHER')}
              className={`py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'TEACHER'
                  ? 'bg-[#0D47A1] text-white shadow-md'
                  : 'text-slate-700 hover:text-[#0D47A1] hover:bg-white/60'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-[#FF8A00]" />
              <span>ĐĂNG NHẬP GIÁO VIÊN</span>
            </button>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {activeTab === 'STUDENT' ? 'Cổng Học Sinh Làm Bài' : 'Cổng Quản Trị Giáo Viên'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeTab === 'STUDENT'
                    ? 'Nhập mã học sinh và mật khẩu được cấp bởi nhà trường'
                    : 'Đăng nhập để soạn đề, phân công bài thi và chấm điểm'}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0D47A1] border border-blue-200">
                {activeTab === 'STUDENT' ? 'Học sinh' : 'Giáo viên/Admin'}
              </span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {activeTab === 'STUDENT' ? 'Mã học sinh / Tài khoản' : 'Tài khoản giáo viên / Quản trị viên'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={activeTab === 'STUDENT' ? 'Ví dụ: HS1001 hoặc 12A1_NAM' : 'Ví dụ: gv_nguyenvana hoặc admin'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-[#0D47A1] text-slate-800 placeholder-slate-400 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D47A1] focus:border-[#0D47A1] text-slate-800 placeholder-slate-400 font-medium transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Tùy chọn: "Hiển thị mật khẩu" as explicitly requested */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1] border-slate-300 focus:ring-[#0D47A1]"
                  />
                  <span>Hiển thị mật khẩu</span>
                </label>
                <span className="text-xs text-slate-500">
                  {activeTab === 'STUDENT' ? 'Quên mật khẩu? Báo GVCN' : 'Hệ thống bảo mật THPT'}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
              >
                <span>ĐĂNG NHẬP</span>
                <ArrowRight className="w-5 h-5 text-[#FF8A00]" />
              </button>
            </form>

            {/* Quick Demo Selector for instant convenience */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tài khoản mẫu để kiểm thử nhanh:
                </span>
                <span className="text-[11px] text-[#0D47A1] font-semibold bg-blue-50 px-2 py-0.5 rounded">
                  Bấm chọn vào ngay
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activeTab === 'STUDENT' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('HS1001', '123456', 'STUDENT')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="font-bold text-slate-800">HS: Nguyễn Hoàng Nam (12A1)</div>
                      <div className="text-slate-500 text-[11px]">Mã: HS1001 • Pass: 123456</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('HS1002', '123456', 'STUDENT')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="font-bold text-slate-800">HS: Trần Thị Mai (12A1)</div>
                      <div className="text-slate-500 text-[11px]">Mã: HS1002 • Pass: 123456</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('HS1003', '123456', 'STUDENT')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-colors sm:col-span-2"
                    >
                      <div className="font-bold text-slate-800">HS: Lê Quốc Bảo (Lớp 11B2)</div>
                      <div className="text-slate-500 text-[11px]">Mã: HS1003 • Pass: 123456</div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('gv_nguyenvana', 'gv123456', 'TEACHER')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="font-bold text-slate-800">GV: Thầy Nguyễn Văn A</div>
                      <div className="text-slate-500 text-[11px]">Môn Toán • Pass: gv123456</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('gv_tuan_tin', 'gv123456', 'TEACHER')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="font-bold text-slate-800">GV: Thầy Lê Quốc Tuấn</div>
                      <div className="text-slate-500 text-[11px]">Môn Tin học • Pass: gv123456</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('gv_thuy_hoa', 'gv123456', 'TEACHER')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="font-bold text-slate-800">GV: Cô Hoàng Thu Thủy</div>
                      <div className="text-slate-500 text-[11px]">Môn Hóa học • Pass: gv123456</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin', 'admin123', 'TEACHER')}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0D47A1] hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="font-bold text-slate-800">Quản trị viên Nhà trường</div>
                      <div className="text-slate-500 text-[11px]">User: admin • Pass: admin123</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Trường THPT Thanh Hòa • Hệ thống Kiểm tra Trắc nghiệm Trực tuyến 2026–2027</p>
        <p className="mt-1">Thiết kế tối ưu cho máy tính, máy tính bảng và điện thoại di động • Bản quyền thuộc Trường THPT Thanh Hòa</p>
      </footer>
    </div>
  );
};
