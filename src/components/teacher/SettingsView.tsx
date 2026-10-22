import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPABASE_URL, SUPABASE_INIT_SQL } from '../../lib/supabase';
import {
  RefreshCw,
  ShieldCheck,
  Database,
  CheckCircle2,
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    resetToSampleData,
    supabaseStatus,
    supabaseMessage,
    syncAllToSupabase,
    refreshFromSupabase,
  } = useApp();

  const [resetDone, setResetDone] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlBox, setShowSqlBox] = useState(false);

  const handleReset = () => {
    resetToSampleData();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    await syncAllToSupabase();
    setSyncing(false);
  };

  const handlePullFromCloud = async () => {
    setSyncing(true);
    await refreshFromSupabase();
    setSyncing(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_INIT_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          CÀI ĐẶT HỆ THỐNG & KẾT NỐI SUPABASE
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cấu hình chung hệ thống kiểm tra trắc nghiệm trực tuyến và đồng bộ cơ sở dữ liệu Supabase
        </p>
      </div>

      {resetDone && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Đã khôi phục dữ liệu mẫu và đồng bộ thành công!</span>
        </div>
      )}

      {/* SUPABASE CONNECTION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Cơ sở dữ liệu đám mây Supabase
              </h2>
              <p className="text-xs text-slate-500 font-mono">{SUPABASE_URL}</p>
            </div>
          </div>

          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center space-x-1.5 ${
              supabaseStatus === 'CONNECTED'
                ? 'bg-emerald-100 text-emerald-800'
                : supabaseStatus === 'NEEDS_TABLES'
                ? 'bg-amber-100 text-amber-800'
                : supabaseStatus === 'CONNECTING'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            <span>
              {supabaseStatus === 'CONNECTED'
                ? 'ĐÃ KẾT NỐI SUPABASE'
                : supabaseStatus === 'NEEDS_TABLES'
                ? 'CẦN TẠO BẢNG TRÊN SUPABASE'
                : supabaseStatus === 'CONNECTING'
                ? 'ĐANG KẾT NỐI...'
                : 'CHƯA ĐỒNG BỘ'}
            </span>
          </span>
        </div>

        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-start space-x-2.5 ${
            supabaseStatus === 'CONNECTED'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          {supabaseStatus === 'CONNECTED' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold">{supabaseMessage}</div>
            {supabaseStatus !== 'CONNECTED' && (
              <div className="text-xs">
                Nếu bạn mới tạo Project trên Supabase và chưa tạo 6 bảng dữ liệu, hãy bấm nút{' '}
                <b>"Sao chép mã SQL khởi tạo 6 bảng"</b> bên dưới, dán vào mục <b>SQL Editor</b>{' '}
                trên trang Supabase và nhấn <b>Run</b>.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={syncing}
            onClick={handleSyncToCloud}
            className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{syncing ? 'Đang đồng bộ...' : 'Đẩy toàn bộ dữ liệu lên Supabase'}</span>
          </button>

          <button
            type="button"
            disabled={syncing}
            onClick={handlePullFromCloud}
            className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <CloudDownload className="w-4 h-4 text-[#0D47A1]" />
            <span>Tải dữ liệu mới nhất từ Supabase</span>
          </button>

          <button
            type="button"
            onClick={handleCopySql}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
          >
            {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Đã sao chép mã SQL!' : 'Sao chép mã SQL khởi tạo 6 bảng'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlBox(!showSqlBox)}
            className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#0D47A1] hover:bg-blue-50 cursor-pointer"
          >
            {showSqlBox ? 'Ẩn mã SQL' : 'Xem mã SQL tạo bảng'}
          </button>
        </div>

        {(showSqlBox || supabaseStatus === 'NEEDS_TABLES') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Mã SQL khởi tạo bảng cho SQL Editor trên Supabase:</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-[#0D47A1] hover:underline cursor-pointer"
              >
                {copiedSql ? 'Đã copy' : 'Copy toàn bộ'}
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 text-xs font-mono overflow-x-auto max-h-72">
              {SUPABASE_INIT_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* GENERAL INFO CARD */}
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
              <span className="text-slate-500 font-semibold block">Chuẩn ma trận đề:</span>
              <span className="font-bold text-emerald-700">
                Bộ Giáo dục và Đào tạo (GDPT 2018: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn)
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
            Nạp lại bộ dữ liệu mẫu ban đầu và đồng bộ lên Supabase.
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
