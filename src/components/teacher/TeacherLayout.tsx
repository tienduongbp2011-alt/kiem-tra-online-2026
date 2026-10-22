import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  FileCheck,
  Database,
  Users,
  GraduationCap,
  BarChart3,
  LineChart,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BookOpen,
  UserCheck,
} from 'lucide-react';

export type TeacherView =
  | 'DASHBOARD'
  | 'EXAMS'
  | 'QUESTIONS'
  | 'SUBJECTS'
  | 'TEACHERS'
  | 'STUDENTS'
  | 'CLASSES'
  | 'RESULTS'
  | 'STATISTICS'
  | 'SETTINGS';

interface TeacherLayoutProps {
  currentView: TeacherView;
  onSelectView: (view: TeacherView) => void;
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  currentView,
  onSelectView,
  children,
}) => {
  const { currentUser, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'DASHBOARD' as TeacherView, label: 'Dashboard (Tổng quan)', icon: LayoutDashboard },
    { id: 'EXAMS' as TeacherView, label: 'Quản lý bài kiểm tra', icon: FileCheck },
    { id: 'QUESTIONS' as TeacherView, label: 'Ngân hàng câu hỏi', icon: Database },
    { id: 'SUBJECTS' as TeacherView, label: 'Danh mục môn thi', icon: BookOpen },
    { id: 'TEACHERS' as TeacherView, label: 'Giáo viên bộ môn', icon: UserCheck },
    { id: 'STUDENTS' as TeacherView, label: 'Học sinh', icon: Users },
    { id: 'CLASSES' as TeacherView, label: 'Lớp học', icon: GraduationCap },
    { id: 'RESULTS' as TeacherView, label: 'Kết quả làm bài', icon: BarChart3 },
    { id: 'STATISTICS' as TeacherView, label: 'Thống kê & Phổ điểm', icon: LineChart },
    { id: 'SETTINGS' as TeacherView, label: 'Cài đặt hệ thống', icon: Settings },
  ];

  const handleNavClick = (view: TeacherView) => {
    onSelectView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#0D47A1] text-white px-4 py-3 flex items-center justify-between shadow sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-white hover:bg-blue-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-extrabold text-base tracking-tight">KIỂM TRA ONLINE</span>
        </div>
        <div className="text-xs text-blue-200 font-bold truncate max-w-[160px]">
          {currentUser?.fullName}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop Fixed, Mobile Slide-over Drawer) */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-[#0D47A1] text-white z-50 flex flex-col justify-between shadow-xl transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand & School Header */}
          <div className="p-5 border-b border-blue-900/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white text-[#0D47A1] flex items-center justify-center font-black shadow">
                <GraduationCap className="w-5 h-5 text-[#0D47A1]" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white block">
                  KIỂM TRA ONLINE
                </span>
                <span className="text-[10px] text-blue-200 font-medium block">
                  Cổng Giáo viên • THPT Thanh Hòa
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-blue-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                    isActive
                      ? 'bg-white text-[#0D47A1] shadow-md'
                      : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF8A00]' : 'text-blue-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-[#0D47A1]" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-blue-900/80 bg-blue-950/40">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-700 border border-blue-400 flex items-center justify-center font-bold text-white text-sm">
              {currentUser?.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.fullName}
              </div>
              <div className="text-[11px] text-blue-200 truncate">
                {currentUser?.role === 'ADMIN' ? 'Quản trị viên' : `Bộ môn: ${currentUser?.subject || 'Toán'}`}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-lg bg-blue-900/80 hover:bg-red-700 text-blue-100 hover:text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất hệ thống</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
