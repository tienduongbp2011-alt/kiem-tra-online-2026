import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubjectItem } from '../../types';
import {
  BookOpen,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  FileCheck,
  Database,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface SubjectManagementProps {
  onNavigateToExamsWithSubject?: (subjectName: string) => void;
  onNavigateToQuestionsWithSubject?: (subjectName: string) => void;
}

export const SubjectManagement: React.FC<SubjectManagementProps> = ({
  onNavigateToExamsWithSubject,
  onNavigateToQuestionsWithSubject,
}) => {
  const { subjects, questions, exams, users, addSubject, updateSubject, deleteSubject } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formGrades, setFormGrades] = useState<(10 | 11 | 12)[]>([10, 11, 12]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredSubjects = subjects.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormGrades([10, 11, 12]);
    setShowModal(true);
  };

  const handleOpenEdit = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code);
    setFormDescription(subject.description || '');
    setFormGrades(subject.grades || [10, 11, 12]);
    setShowModal(true);
  };

  const handleToggleGrade = (grade: 10 | 11 | 12) => {
    if (formGrades.includes(grade)) {
      if (formGrades.length > 1) {
        setFormGrades(formGrades.filter((g) => g !== grade));
      }
    } else {
      setFormGrades([...formGrades, grade].sort());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Vui lòng nhập tên môn học');
      return;
    }

    const cleanCode = (formCode.trim() || formName.trim().toUpperCase().replace(/\s+/g, '_')).slice(0, 10);

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: formName.trim(),
        code: cleanCode,
        description: formDescription.trim(),
        grades: formGrades,
      });
      setSuccessMessage(`Đã cập nhật môn "${formName.trim()}" thành công!`);
    } else {
      addSubject({
        name: formName.trim(),
        code: cleanCode,
        description: formDescription.trim(),
        grades: formGrades,
      });
      setSuccessMessage(`Đã thêm môn học mới "${formName.trim()}" thành công!`);
    }

    setShowModal(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = (subject: SubjectItem) => {
    const examCount = exams.filter((e) => e.subject === subject.name).length;
    const qCount = questions.filter((q) => q.subject === subject.name).length;

    let warning = `Bạn có chắc muốn xóa môn "${subject.name}"?`;
    if (examCount > 0 || qCount > 0) {
      warning += `\nLưu ý: Môn này đang có ${qCount} câu hỏi và ${examCount} đề thi trong hệ thống.`;
    }

    if (confirm(warning)) {
      deleteSubject(subject.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            QUẢN LÝ DANH MỤC MÔN THI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tự tạo và cấu hình thêm các môn học để giáo viên từng bộ môn cùng vào tạo bài thi và ngân hàng câu hỏi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-[#FF8A00]" />
          <span>TẠO MÔN THI MỚI</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên môn, mã môn..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0D47A1]"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 hidden sm:block">
          Tổng số: <span className="text-[#0D47A1] font-black">{subjects.length}</span> môn học trong hệ thống
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((sub) => {
          const qCount = questions.filter((q) => q.subject === sub.name).length;
          const examCount = exams.filter((e) => e.subject === sub.name).length;
          const assignedTeachers = users.filter(
            (u) => (u.role === 'TEACHER' || u.role === 'ADMIN') && u.subject === sub.name
          );

          return (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-black text-sm border border-blue-200 shadow-inner">
                      {sub.code.slice(0, 4)}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-800">{sub.name}</h2>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        Mã: {sub.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      title="Chỉnh sửa môn học"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      title="Xóa môn học"
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] mb-3">
                  {sub.description || `Môn học ${sub.name} trong chương trình THPT 2026–2027`}
                </p>

                {/* Grades & Teachers */}
                <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Khối áp dụng:</span>
                    <span className="font-bold text-[#0D47A1]">
                      {sub.grades ? sub.grades.map((g) => `K${g}`).join(', ') : 'K10, K11, K12'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Giáo viên phụ trách:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[140px]">
                      {assignedTeachers.length > 0
                        ? assignedTeachers.map((t) => t.fullName).join(', ')
                        : 'Chưa gán GV'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Counts & Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                  <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                    <span className="text-slate-500 text-[10px] block font-semibold">Câu hỏi</span>
                    <span className="font-black text-[#0D47A1] text-sm">{qCount}</span>
                  </div>
                  <div className="bg-orange-50/60 p-2 rounded-lg border border-orange-100">
                    <span className="text-slate-500 text-[10px] block font-semibold">Đề kiểm tra</span>
                    <span className="font-black text-[#FF8A00] text-sm">{examCount}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {onNavigateToExamsWithSubject && (
                    <button
                      onClick={() => onNavigateToExamsWithSubject(sub.name)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Xem đề</span>
                    </button>
                  )}
                  {onNavigateToQuestionsWithSubject && (
                    <button
                      onClick={() => onNavigateToQuestionsWithSubject(sub.name)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0D47A1] font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Ngân hàng</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <h2 className="text-lg font-black text-slate-800">
                {editingSubject ? 'CHỈNH SỬA MÔN THI' : 'TẠO MÔN THI MỚI'}
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
                <label className="block font-bold text-slate-700 mb-1">Tên môn thi / môn học</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingSubject && !formCode) {
                      setFormCode(
                        e.target.value
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, '')
                          .slice(0, 8)
                      );
                    }
                  }}
                  placeholder="Ví dụ: Tin học, GDKT & PL, Âm nhạc..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã viết tắt</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: TIN, GDKTPL, AN..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Khối lớp áp dụng:</label>
                <div className="flex items-center space-x-3">
                  {([10, 11, 12] as const).map((g) => {
                    const isSelected = formGrades.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => handleToggleGrade(g)}
                        className={`flex-1 py-2 rounded-xl font-bold text-xs border transition-all ${
                          isSelected
                            ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Khối {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả môn học</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt về môn học này..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
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
                  <span>LƯU MÔN THI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
