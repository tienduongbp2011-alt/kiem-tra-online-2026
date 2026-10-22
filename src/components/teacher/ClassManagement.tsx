import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolClass } from '../../types';
import {
  GraduationCap,
  PlusCircle,
  Users,
  Edit2,
  Trash2,
  X,
  BookOpen,
  Calendar,
} from 'lucide-react';

export const ClassManagement: React.FC = () => {
  const { classes, users, addClass, updateClass, deleteClass } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState<10 | 11 | 12>(12);
  const [teacherName, setTeacherName] = useState('');
  const [classRoom, setClassRoom] = useState('P.301');

  const students = users.filter((u) => u.role === 'STUDENT');

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassName('');
    setClassGrade(12);
    setTeacherName('');
    setClassRoom('P.301');
    setShowModal(true);
  };

  const handleOpenEdit = (cls: SchoolClass) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassGrade(cls.grade);
    setTeacherName(cls.homeroomTeacher || '');
    setClassRoom(cls.room || '');
    setShowModal(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      alert('Vui lòng nhập tên lớp');
      return;
    }

    const payload: SchoolClass = {
      id: editingClass ? editingClass.id : `cls_${className.trim()}`,
      name: className.trim(),
      grade: classGrade,
      academicYear: '2026-2027',
      homeroomTeacher: teacherName.trim(),
      room: classRoom.trim(),
    };

    if (editingClass) {
      updateClass(editingClass.id, payload);
    } else {
      addClass(payload);
    }

    setShowModal(false);
    setEditingClass(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            QUẢN LÝ LỚP HỌC THPT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết lập danh sách các lớp học thuộc khối 10, 11, 12 năm học 2026–2027
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-[#FF8A00]" />
          <span>THÊM LỚP MỚI</span>
        </button>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const studentCount = students.filter(
            (s) => s.className === cls.name || s.classId === cls.id
          ).length;

          return (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0D47A1] flex items-center justify-center font-black text-lg border border-blue-200 shadow-inner">
                      {cls.name}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block uppercase">
                        Khối {cls.grade}
                      </span>
                      <h2 className="text-lg font-black text-slate-800">Lớp {cls.name}</h2>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Sửa lớp"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa lớp ${cls.name}?`)) {
                          deleteClass(cls.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa lớp"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giáo viên chủ nhiệm:</span>
                    <span className="font-bold text-slate-800">
                      {cls.homeroomTeacher || 'Chưa phân công'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phòng học:</span>
                    <span className="font-bold text-slate-800">{cls.room || 'Phòng bộ môn'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Năm học:</span>
                    <span className="font-bold text-[#0D47A1]">{cls.academicYear}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                  <Users className="w-4 h-4 text-[#0D47A1]" />
                  <span>Sĩ số:</span>
                </span>
                <span className="font-extrabold text-[#0D47A1] text-sm">
                  {studentCount} học sinh
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <h2 className="text-lg font-black text-slate-800">
                {editingClass ? 'CHỈNH SỬA LỚP HỌC' : 'THÊM LỚP HỌC MỚI'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên lớp</label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Ví dụ: 12A3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối</label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(Number(e.target.value) as 10 | 11 | 12)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="12">Khối 12</option>
                    <option value="11">Khối 11</option>
                    <option value="10">Khối 10</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Giáo viên chủ nhiệm</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ví dụ: Thầy Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phòng học</label>
                <input
                  type="text"
                  value={classRoom}
                  onChange={(e) => setClassRoom(e.target.value)}
                  placeholder="Ví dụ: P.305"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
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
                  className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Lưu lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
