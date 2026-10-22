import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  downloadStudentTemplateExcel,
  parseStudentsFromExcel,
} from '../../utils/excelUtils';
import * as XLSX from 'xlsx';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { users, classes, addUser, updateUser, deleteUser, importUsers, resetUserPassword } =
    useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formClass, setFormClass] = useState('12A1');
  const [formPassword, setFormPassword] = useState('123456');
  const [formActive, setFormActive] = useState(true);

  // Excel Import state
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState<string | null>(null);
  const [previewStudents, setPreviewStudents] = useState<User[]>([]);

  // Students list
  const students = users.filter((u) => u.role === 'STUDENT');

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass === 'ALL' || s.className === filterClass;
    return matchSearch && matchClass;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormCode(`HS${Math.floor(1000 + Math.random() * 9000)}`);
    setFormClass(classes[0]?.name || '12A1');
    setFormPassword('123456');
    setFormActive(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: User) => {
    setEditingUser(student);
    setFormName(student.fullName);
    setFormCode(student.studentCode || student.username);
    setFormClass(student.className || '12A1');
    setFormPassword(student.passwordHash);
    setFormActive(student.active);
    setShowAddModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('Vui lòng điền đủ họ tên và mã học sinh');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        fullName: formName.trim(),
        studentCode: formCode.trim(),
        username: formCode.trim(),
        className: formClass,
        classId: formClass,
        passwordHash: formPassword.trim() || '123456',
        active: formActive,
      });
    } else {
      addUser({
        id: `u_hs_${formCode.trim()}_${Date.now()}`,
        fullName: formName.trim(),
        studentCode: formCode.trim(),
        username: formCode.trim(),
        className: formClass,
        classId: formClass,
        passwordHash: formPassword.trim() || '123456',
        role: 'STUDENT',
        active: formActive,
      });
    }

    setShowAddModal(false);
    setEditingUser(null);
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelErrors([]);
    setExcelSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const res = parseStudentsFromExcel(buffer);
      if (res.errors.length > 0) {
        setExcelErrors(res.errors);
      }
      setPreviewStudents(res.users);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteExcelImport = () => {
    if (previewStudents.length === 0) {
      alert('Không có học sinh hợp lệ nào để nhập.');
      return;
    }
    const count = importUsers(previewStudents);
    setExcelSuccessMsg(`Đã nhập thành công ${count} học sinh vào hệ thống!`);
    setTimeout(() => {
      setShowImportModal(false);
      setExcelSuccessMsg(null);
      setPreviewStudents([]);
    }, 1500);
  };

  const handleExportStudents = () => {
    const exportData = filteredStudents.map((s, idx) => ({
      'STT': idx + 1,
      'Mã HS': s.studentCode || s.username,
      'Họ và tên': s.fullName,
      'Lớp': s.className || '',
      'Tài khoản': s.username,
      'Trạng thái': s.active ? 'Đang hoạt động' : 'Đã khóa',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HocSinh');
    XLSX.writeFile(workbook, `Danh_sach_hoc_sinh_${filterClass}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            QUẢN LÝ HỌC SINH
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý tài khoản đăng nhập, danh sách học sinh theo lớp, reset mật khẩu và import Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportStudents}
            className="py-2.5 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>XUẤT EXCEL</span>
          </button>
          <button
            onClick={() => {
              setPreviewStudents([]);
              setExcelErrors([]);
              setExcelSuccessMsg(null);
              setShowImportModal(true);
            }}
            className="py-2.5 px-3.5 rounded-xl bg-[#FF8A00] hover:bg-orange-600 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>IMPORT EXCEL</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>THÊM HỌC SINH</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên, mã học sinh..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Lớp:</span>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                Lớp {cls.name}
              </option>
            ))}
          </select>
          <span className="text-slate-400 font-semibold ml-2">
            ({filteredStudents.length} học sinh)
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">STT</th>
                <th className="py-3.5 px-3">Mã học sinh</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-3">Lớp</th>
                <th className="py-3.5 px-3">Tài khoản</th>
                <th className="py-3.5 px-3 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0D47A1]">
                    {s.studentCode || s.username}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{s.fullName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0D47A1] font-bold text-xs">
                      {s.className}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{s.username}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        s.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.active ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Hoạt động</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>Đã khóa</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Reset Password as required */}
                      <button
                        onClick={() => {
                          if (confirm(`Đặt lại mật khẩu cho học sinh "${s.fullName}" về mặc định "123456"?`)) {
                            resetUserPassword(s.id, '123456');
                            alert('Đã đặt lại mật khẩu về: 123456');
                          }
                        }}
                        title="Reset mật khẩu về 123456"
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Edit as required */}
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Chỉnh sửa thông tin"
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete as required */}
                      <button
                        onClick={() => {
                          if (confirm(`Xóa học sinh "${s.fullName}" khỏi hệ thống?`)) {
                            deleteUser(s.id);
                          }
                        }}
                        title="Xóa học sinh"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: IMPORT HỌC SINH TỪ FILE EXCEL                    */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF8A00] flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    IMPORT DANH SÁCH HỌC SINH TỪ EXCEL
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mẫu cột: STT | Mã HS | Họ và tên | Lớp | Mật khẩu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {excelSuccessMsg && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{excelSuccessMsg}</span>
              </div>
            )}

            {/* Template Download Button as requested */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Tải file mẫu Excel chuẩn nhà trường
                </span>
                <span className="text-[11px] text-slate-500">
                  Định dạng .xlsx gồm các cột: STT, Mã HS, Họ và tên, Lớp, Mật khẩu
                </span>
              </div>
              <button
                type="button"
                onClick={downloadStudentTemplateExcel}
                className="py-2 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#0D47A1]" />
                <span>Tải file mẫu</span>
              </button>
            </div>

            {/* Upload Area */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chọn file Excel từ máy tính (.xlsx hoặc .csv):
              </label>
              <label className="w-full border-2 border-dashed border-slate-300 hover:border-[#0D47A1] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors">
                <Upload className="w-8 h-8 text-[#0D47A1] mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  Nhấp để tải lên file Excel học sinh
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Hỗ trợ định dạng .xlsx, .xls, .csv
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Errors if any */}
            {excelErrors.length > 0 && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Phát hiện lỗi trong file Excel:</span>
                </div>
                {excelErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            {/* Preview Count */}
            {previewStudents.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 mb-4 flex items-center justify-between">
                <span>Tìm thấy {previewStudents.length} học sinh hợp lệ để nhập vào hệ thống!</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecuteExcelImport}
                disabled={previewStudents.length === 0}
                className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                XÁC NHẬN NHẬP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: THÊM / SỬA HỌC SINH THỦ CÔNG                    */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <h2 className="text-lg font-black text-slate-800">
                {editingUser ? 'CHỈNH SỬA HỌC SINH' : 'THÊM HỌC SINH MỚI'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên học sinh</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Hoàng Nam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã học sinh</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="HS1001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-[#0D47A1]"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Lớp {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu đăng nhập</label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1]"
                  />
                  <span>Tài khoản đang hoạt động (cho phép đăng nhập)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Lưu học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
