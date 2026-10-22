import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  UserCheck,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  CheckCircle2,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const TeacherManagement: React.FC = () => {
  const { users, subjects, addUser, updateUser, deleteUser, resetUserPassword, login } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('gv123456');
  const [formSubject, setFormSubject] = useState(subjects[0]?.name || 'Toán');
  const [formRole, setFormRole] = useState<'TEACHER' | 'ADMIN'>('TEACHER');
  const [formActive, setFormActive] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Filter only teachers & admins
  const teacherList = users.filter((u) => u.role === 'TEACHER' || u.role === 'ADMIN');

  const filteredTeachers = teacherList.filter((t) => {
    const matchSearch =
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSub = filterSubject === 'ALL' || t.subject === filterSubject;
    return matchSearch && matchSub;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('gv123456');
    setFormSubject(subjects[0]?.name || 'Toán');
    setFormRole('TEACHER');
    setFormActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (teacher: User) => {
    setEditingTeacher(teacher);
    setFormName(teacher.fullName);
    setFormUsername(teacher.username);
    setFormPassword(teacher.passwordHash);
    setFormSubject(teacher.subject || subjects[0]?.name || 'Toán');
    setFormRole(teacher.role as 'TEACHER' | 'ADMIN');
    setFormActive(teacher.active);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      alert('Vui lòng nhập họ tên và tên đăng nhập');
      return;
    }

    if (editingTeacher) {
      updateUser(editingTeacher.id, {
        fullName: formName.trim(),
        username: formUsername.trim(),
        passwordHash: formPassword.trim() || 'gv123456',
        subject: formSubject,
        role: formRole,
        active: formActive,
      });
      setNotification(`Đã cập nhật tài khoản "${formName.trim()}" thành công!`);
    } else {
      // Check username duplicate
      const exists = users.some(
        (u) => u.username.toLowerCase() === formUsername.trim().toLowerCase()
      );
      if (exists) {
        alert(`Tên đăng nhập "${formUsername.trim()}" đã được sử dụng. Vui lòng chọn tên khác!`);
        return;
      }

      addUser({
        id: `u_gv_${Date.now()}`,
        fullName: formName.trim(),
        username: formUsername.trim(),
        passwordHash: formPassword.trim() || 'gv123456',
        subject: formSubject,
        role: formRole,
        active: formActive,
      });
      setNotification(`Đã cấp tài khoản cho ${formName.trim()} (Môn: ${formSubject}) thành công!`);
    }

    setShowModal(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSwitchAccount = (teacher: User) => {
    if (confirm(`Chuyển phiên làm việc sang tài khoản của ${teacher.fullName} (Môn ${teacher.subject || 'Toàn trường'})?`)) {
      login(teacher.username, teacher.passwordHash);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            QUẢN LÝ TÀI KHOẢN GIÁO VIÊN BỘ MÔN
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cấp quyền và tạo tài khoản cho giáo viên các môn khác nhau để cùng tham gia soạn đề, chấm bài và quản lý ngân hàng câu hỏi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#FF8A00]" />
          <span>THÊM TÀI KHOẢN GIÁO VIÊN</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên giáo viên, tài khoản..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 w-full md:w-auto">
          <span>Lọc theo môn:</span>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả các bộ môn</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.name}>
                Môn {sub.name}
              </option>
            ))}
          </select>
          <span className="text-slate-400 font-semibold ml-2">
            ({filteredTeachers.length} giáo viên)
          </span>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">STT</th>
                <th className="py-3.5 px-4">Họ và tên giáo viên</th>
                <th className="py-3.5 px-3">Tài khoản đăng nhập</th>
                <th className="py-3.5 px-3">Môn phụ trách</th>
                <th className="py-3.5 px-3">Vai trò</th>
                <th className="py-3.5 px-3 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div className="flex items-center space-x-2">
                      <span>{t.fullName}</span>
                      {t.role === 'ADMIN' && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-extrabold">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-[#0D47A1]">
                    {t.username}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0D47A1] font-bold text-xs border border-blue-200 inline-block">
                      {t.subject || 'Chung'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-600">
                    {t.role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên bộ môn'}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.active ? (
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
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Switch to this teacher button */}
                      <button
                        onClick={() => handleSwitchAccount(t)}
                        title={`Đăng nhập nhanh với quyền của ${t.fullName}`}
                        className="p-1.5 rounded-lg text-[#0D47A1] hover:bg-blue-50 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>

                      {/* Reset password */}
                      <button
                        onClick={() => {
                          if (confirm(`Đặt lại mật khẩu cho "${t.fullName}" về mặc định "gv123456"?`)) {
                            resetUserPassword(t.id, 'gv123456');
                            alert('Đã đặt lại mật khẩu về: gv123456');
                          }
                        }}
                        title="Reset mật khẩu về gv123456"
                        className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Chỉnh sửa thông tin"
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${t.fullName}"?`)) {
                            deleteUser(t.id);
                          }
                        }}
                        title="Xóa giáo viên"
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

      {/* Add / Edit Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <h2 className="text-lg font-black text-slate-800">
                {editingTeacher ? 'CHỈNH SỬA TÀI KHOẢN GIÁO VIÊN' : 'CẤP TÀI KHOẢN GIÁO VIÊN MỚI'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên giáo viên</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingTeacher && !formUsername) {
                      const clean = e.target.value
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '');
                      setFormUsername(`gv_${clean}`);
                    }
                  }}
                  placeholder="Ví dụ: Thầy Lê Quốc Tuấn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Môn học phụ trách</label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-[#0D47A1] bg-white"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      Môn {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  * Giáo viên sẽ cùng tham gia tạo đề thi và ngân hàng câu hỏi môn này.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Ví dụ: gv_tuan_tin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu đăng nhập</label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="gv123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò quyền hạn</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'TEACHER' | 'ADMIN')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="TEACHER">Giáo viên bộ môn</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div className="pt-6">
                  <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0D47A1]"
                    />
                    <span>Kích hoạt tài khoản</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                  <span>CẤP TÀI KHOẢN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
