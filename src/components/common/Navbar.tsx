import React from 'react';
import { useApp } from '../../context/AppContext';
import { GraduationCap, LogOut, User as UserIcon, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  onNavigateHome?: () => void;
  onOpenMobileMenu?: () => void;
  isTakingExam?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateHome, onOpenMobileMenu, isTakingExam }) => {
  const { currentUser, logout } = useApp();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0D47A1] text-white shadow-md border-b border-blue-900 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            {onOpenMobileMenu && !isTakingExam && (
              <button
                onClick={onOpenMobileMenu}
                className="md:hidden p-2 rounded-lg text-white hover:bg-blue-800 focus:outline-none"
                aria-label="Mở menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-3 text-left focus:outline-none group"
              disabled={isTakingExam}
            >
              <div className="w-10 h-10 rounded-xl bg-white text-[#0D47A1] flex items-center justify-center font-black shadow-inner">
                <GraduationCap className="w-6 h-6 text-[#0D47A1]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-blue-100 transition-colors">
                    KIỂM TRA ONLINE
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-semibold bg-[#FF8A00] text-white px-2 py-0.5 rounded">
                    THPT THANH HÒA
                  </span>
                </div>
                <p className="text-xs text-blue-200 hidden sm:block">
                  Trường THPT Thanh Hòa • Năm học 2026–2027
                </p>
              </div>
            </button>
          </div>

          {/* Right Status & User Info */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Online/Offline Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                isOnline ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden md:inline">Trực tuyến</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-300" />
                  <span>Mất mạng</span>
                </>
              )}
            </div>

            {currentUser && !isTakingExam && (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-white leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-xs text-blue-200 flex items-center justify-end space-x-1">
                    <span>
                      {currentUser.role === 'STUDENT'
                        ? `Học sinh • Lớp ${currentUser.className || '12A1'}`
                        : currentUser.role === 'ADMIN'
                        ? 'Quản trị viên'
                        : `Giáo viên ${currentUser.subject ? `• ${currentUser.subject}` : ''}`}
                    </span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-blue-700/80 border border-blue-400 flex items-center justify-center text-white">
                  <UserIcon className="w-4 h-4" />
                </div>

                <button
                  onClick={logout}
                  title="Đăng xuất khỏi hệ thống"
                  className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors flex items-center space-x-1 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
