import * as XLSX from 'xlsx';
import { ExamAttempt, User } from '../types';

export function exportExamResultsToExcel(
  attempts: ExamAttempt[],
  examTitle: string,
  fileName?: string
) {
  const data = attempts.map((att, index) => {
    const minutes = Math.floor((att.timeSpentSeconds || 0) / 60);
    const seconds = (att.timeSpentSeconds || 0) % 60;
    const timeFormatted = `${minutes} phút ${seconds.toString().padStart(2, '0')} giây`;
    const submittedFormatted = att.submittedAt
      ? new Date(att.submittedAt).toLocaleString('vi-VN')
      : 'Chưa nộp';

    return {
      'STT': index + 1,
      'Mã học sinh': att.studentCode,
      'Họ và tên': att.studentName,
      'Lớp': att.className,
      'Điểm': att.score,
      'Số câu đúng': att.correctCount,
      'Số câu sai': att.wrongCount,
      'Thời gian làm bài': timeFormatted,
      'Thời điểm nộp bài': submittedFormatted,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 6 }, // STT
    { wch: 14 }, // Mã HS
    { wch: 25 }, // Họ tên
    { wch: 10 }, // Lớp
    { wch: 10 }, // Điểm
    { wch: 14 }, // Đúng
    { wch: 14 }, // Sai
    { wch: 20 }, // Thời gian làm bài
    { wch: 22 }, // Thời điểm nộp
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả bài thi');

  const safeFileName = fileName || `Ket_qua_${examTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, safeFileName);
}

export function downloadStudentTemplateExcel() {
  const sampleData = [
    { 'STT': 1, 'Mã HS': 'HS2001', 'Họ và tên': 'Nguyễn Văn Minh', 'Lớp': '12A1', 'Mật khẩu': '123456' },
    { 'STT': 2, 'Mã HS': 'HS2002', 'Họ và tên': 'Lê Thị Thu Thảo', 'Lớp': '12A1', 'Mật khẩu': '123456' },
    { 'STT': 3, 'Mã HS': 'HS2003', 'Họ và tên': 'Phạm Hoàng Long', 'Lớp': '12A2', 'Mật khẩu': '123456' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 26 },
    { wch: 12 },
    { wch: 14 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_sach_hoc_sinh');
  XLSX.writeFile(workbook, 'Mau_nhap_hoc_sinh.xlsx');
}

export function parseStudentsFromExcel(
  fileBuffer: ArrayBuffer
): { success: boolean; users: User[]; errors: string[] } {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    const users: User[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const studentCode = (row['Mã HS'] || row['Mã học sinh'] || row['Ma HS'] || row['Code'] || '').toString().trim();
      const fullName = (row['Họ và tên'] || row['Họ tên'] || row['Ho va ten'] || row['Name'] || '').toString().trim();
      const className = (row['Lớp'] || row['Lop'] || row['Class'] || '').toString().trim();
      const password = (row['Mật khẩu'] || row['Mat khau'] || row['Password'] || '123456').toString().trim();

      if (!studentCode) {
        errors.push(`Dòng ${rowNum}: Thiếu Mã học sinh`);
        return;
      }
      if (!fullName) {
        errors.push(`Dòng ${rowNum}: Thiếu Họ và tên học sinh`);
        return;
      }
      if (!className) {
        errors.push(`Dòng ${rowNum}: Thiếu Lớp`);
        return;
      }

      users.push({
        id: `u_hs_${studentCode}_${Date.now()}_${idx}`,
        username: studentCode,
        studentCode,
        passwordHash: password,
        fullName,
        role: 'STUDENT',
        classId: className,
        className,
        active: true,
      });
    });

    return {
      success: errors.length === 0,
      users,
      errors,
    };
  } catch (err: any) {
    return {
      success: false,
      users: [],
      errors: [`Không thể đọc file: ${err.message || 'Lỗi định dạng file'}`],
    };
  }
}
